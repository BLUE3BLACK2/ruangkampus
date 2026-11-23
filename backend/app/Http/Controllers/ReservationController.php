<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ReservationController extends Controller
{
    /** Riwayat reservasi milik pengguna yang sedang login. */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::in(Reservation::STATUSES)],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ]);

        $paginator = $request->user()->reservations()
            ->with('room')
            ->when(
                filled($validated['status'] ?? null),
                fn($q) => $q->where('status', $validated['status'])
            )
            ->orderByDesc('reservation_date')
            ->orderByDesc('start_time')
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        return response()->json([
            'success' => true,
            'message' => 'Riwayat reservasi berhasil diambil.',
            'data' => ReservationResource::collection($paginator)->resolve(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /** Detail reservasi: hanya pemilik atau admin. */
    public function show(Request $request, Reservation $reservation): JsonResponse
    {
        $user = $request->user();

        if ($reservation->user_id !== $user->id && $user->role !== 'admin') {
            return $this->fail('Anda tidak berhak melihat reservasi ini.', 403);
        }

        $reservation->load(['room', 'user', 'logs']);

        return response()->json([
            'success' => true,
            'message' => 'Detail reservasi berhasil diambil.',
            'data' => ReservationResource::make($reservation)->resolve(),
        ]);
    }

    /** Ajukan reservasi baru (status awal: pending). */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            return $this->fail('Administrator tidak dapat mengajukan reservasi.', 403);
        }

        $validated = $request->validate([
            'room_id' => ['required', 'integer', 'exists:rooms,id'],
            'reservation_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'purpose' => ['required', 'string', 'max:1000'],
            'participant_count' => ['required', 'integer', 'min:1'],
        ]);

        // Simpan sebagai H:i:s agar perbandingan jam konsisten di semua database.
        $date = $validated['reservation_date'];
        $start = $validated['start_time'] . ':00';
        $end = $validated['end_time'] . ':00';

        if (Carbon::parse("$date $start")->isPast()) {
            throw ValidationException::withMessages([
                'start_time' => 'Waktu mulai sudah lewat.',
            ]);
        }

        // Transaksi + kunci baris ruangan: dua pengajuan untuk ruangan yang sama
        // diproses bergantian, jadi pengecekan bentrok tidak bisa "berpapasan".
        $reservation = DB::transaction(function () use ($validated, $user, $date, $start, $end) {
            $room = Room::whereKey($validated['room_id'])->lockForUpdate()->firstOrFail();

            if ($room->status !== 'available') {
                throw ValidationException::withMessages([
                    'room_id' => 'Ruangan sedang tidak tersedia untuk reservasi.',
                ]);
            }

            if ($validated['participant_count'] > $room->capacity) {
                throw ValidationException::withMessages([
                    'participant_count' => "Jumlah peserta melebihi kapasitas ruangan ({$room->capacity}).",
                ]);
            }

            if (Reservation::slotTaken($room->id, $date, $start, $end)) {
                throw ValidationException::withMessages([
                    'start_time' => 'Ruangan sudah dipesan pada jam tersebut.',
                ]);
            }

            $reservation = Reservation::create([
                'reservation_code' => $this->makeCode(),
                'user_id' => $user->id,
                'room_id' => $room->id,
                'reservation_date' => $date,
                'start_time' => $start,
                'end_time' => $end,
                'purpose' => $validated['purpose'],
                'participant_count' => $validated['participant_count'],
                'status' => 'pending',
            ]);

            $reservation->logStatus(null, null, 'Reservasi diajukan.');

            return $reservation;
        });

        $reservation->load('room');

        return response()->json([
            'success' => true,
            'message' => 'Reservasi berhasil diajukan dan menunggu persetujuan admin.',
            'data' => ReservationResource::make($reservation)->resolve(),
        ], 201);
    }

    /** Pemohon membatalkan reservasinya sendiri. */
    public function cancel(Request $request, Reservation $reservation): JsonResponse
    {
        if ($reservation->user_id !== $request->user()->id) {
            return $this->fail('Anda tidak berhak membatalkan reservasi ini.', 403);
        }

        $locked = DB::transaction(function () use ($reservation) {
            // Kunci baris supaya tidak bertabrakan dengan keputusan admin.
            $current = Reservation::whereKey($reservation->id)->lockForUpdate()->firstOrFail();

            if (!in_array($current->status, Reservation::BLOCKING_STATUSES, true)) {
                throw ValidationException::withMessages([
                    'status' => "Reservasi berstatus {$current->status} tidak dapat dibatalkan.",
                ]);
            }

            $startsAt = Carbon::parse($current->reservation_date->format('Y-m-d') . ' ' . $current->start_time);

            if ($startsAt->isPast()) {
                throw ValidationException::withMessages([
                    'status' => 'Reservasi yang sudah dimulai tidak dapat dibatalkan.',
                ]);
            }

            $previous = $current->status;
            $current->update(['status' => 'cancelled']);
            $current->logStatus($previous, null, 'Dibatalkan oleh pemohon.');

            return $current;
        });

        $locked->load('room');

        return response()->json([
            'success' => true,
            'message' => 'Reservasi berhasil dibatalkan.',
            'data' => ReservationResource::make($locked)->resolve(),
        ]);
    }

    private function makeCode(): string
    {
        return 'RSV-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6));
    }

    private function fail(string $message, int $status): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => (object) [],
        ], $status);
    }
}