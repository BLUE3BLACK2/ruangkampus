<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminReservationController extends Controller
{
    /** Seluruh permohonan reservasi, dengan filter opsional. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::in(Reservation::STATUSES)],
            'room_id' => ['nullable', 'integer'],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ]);

        $statusCounts = Reservation::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $paginator = Reservation::query()
            ->with(['room', 'user'])
            ->when(
                filled($validated['status'] ?? null),
                fn($q) => $q->where('status', $validated['status'])
            )
            ->when(
                filled($validated['room_id'] ?? null),
                fn($q) => $q->where('room_id', $validated['room_id'])
            )
            ->when(
                filled($validated['date'] ?? null),
                fn($q) => $q->whereDate('reservation_date', $validated['date'])
            )
            ->when(filled($validated['search'] ?? null), function ($q) use ($validated) {
                $term = '%' . $validated['search'] . '%';
                $q->where(fn($w) => $w
                    ->where('reservation_code', 'like', $term)
                    ->orWhereHas('user', fn($u) => $u->where('name', 'like', $term)));
            })
            ->latest('id')
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        return ReservationResource::collection($paginator)->additional([
            'summary' => [
                'total' => Reservation::count(),
                'pending' => (int) ($statusCounts['pending'] ?? 0),
                'approved' => (int) ($statusCounts['approved'] ?? 0),
                'rejected' => (int) ($statusCounts['rejected'] ?? 0),
                'cancelled' => (int) ($statusCounts['cancelled'] ?? 0),
            ],
        ]);
    }

    /** Setujui reservasi. Catatan opsional. */
    public function approve(Request $request, Reservation $reservation): JsonResponse
    {
        $validated = $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        return $this->decide(
            $request,
            $reservation,
            'approved',
            $validated['admin_notes'] ?? null,
            'Reservasi disetujui.',
        );
    }

    /** Tolak reservasi. Catatan wajib supaya pemohon tahu alasannya. */
    public function reject(Request $request, Reservation $reservation): JsonResponse
    {
        $validated = $request->validate([
            'admin_notes' => ['required', 'string', 'max:1000'],
        ]);

        return $this->decide(
            $request,
            $reservation,
            'rejected',
            $validated['admin_notes'],
            'Reservasi ditolak.',
        );
    }

    /**
     * Setujui atau tolak, hanya untuk reservasi berstatus pending.
     * Baris dikunci supaya tidak bertabrakan dengan pembatalan oleh pemohon:
     * siapa yang lebih dulu memegang kunci, dialah yang menentukan status akhir.
     */

    private function decide(
        Request $request,
        Reservation $reservation,
        string $newStatus,
        ?string $notes,
        string $defaultLogNote,
    ): JsonResponse {
        $admin = $request->user();

        $decided = DB::transaction(function () use ($reservation, $admin, $newStatus, $notes, $defaultLogNote) {
            $current = Reservation::whereKey($reservation->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($current->status !== 'pending') {
                throw ValidationException::withMessages([
                    'status' => "Reservasi berstatus {$current->status} tidak dapat diproses.",
                ]);
            }

            // Validasi tambahan hanya saat menyetujui reservasi.
            if ($newStatus === 'approved') {
                $room = Room::whereKey($current->room_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($room->status !== 'available') {
                    throw ValidationException::withMessages([
                        'room' => 'Ruangan tidak tersedia untuk reservasi.',
                    ]);
                }

                if ($current->participant_count > $room->capacity) {
                    throw ValidationException::withMessages([
                        'participant_count' => 'Jumlah peserta melebihi kapasitas ruangan.',
                    ]);
                }

                if (Reservation::slotTaken(
                    $current->room_id,
                    $current->reservation_date->format('Y-m-d'),
                    $current->start_time,
                    $current->end_time,
                    $current->id,
                )) {
                    throw ValidationException::withMessages([
                        'schedule' => 'Jadwal reservasi bertabrakan dengan reservasi lain.',
                    ]);
                }
            }

            $previous = $current->status;

            $current->update([
                'status' => $newStatus,
                'admin_notes' => $notes,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
            ]);

            $current->logStatus($previous, $admin, $notes ?? $defaultLogNote);

            return $current;
        });

        $decided->load(['room', 'user', 'logs']);

        return response()->json([
            'success' => true,
            'message' => $newStatus === 'approved'
                ? 'Reservasi berhasil disetujui.'
                : 'Reservasi berhasil ditolak.',
            'data' => ReservationResource::make($decided)->resolve(),
        ]);
    }
}