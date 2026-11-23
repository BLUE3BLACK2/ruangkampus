<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminReservationController extends Controller
{
    /** Seluruh permohonan reservasi, dengan filter opsional. */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::in(Reservation::STATUSES)],
            'room_id' => ['nullable', 'integer'],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ]);

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

        return response()->json([
            'success' => true,
            'message' => 'Daftar reservasi berhasil diambil.',
            'data' => ReservationResource::collection($paginator)->resolve(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
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
            $current = Reservation::whereKey($reservation->id)->lockForUpdate()->firstOrFail();

            if ($current->status !== 'pending') {
                throw ValidationException::withMessages([
                    'status' => "Reservasi berstatus {$current->status} tidak dapat diproses.",
                ]);
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