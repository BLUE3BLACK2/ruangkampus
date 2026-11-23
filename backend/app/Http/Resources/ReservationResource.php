<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reservation_code' => $this->reservation_code,
            'user_id' => $this->user_id,
            'room_id' => $this->room_id,
            'reservation_date' => $this->reservation_date?->format('Y-m-d'),
            'start_time' => substr($this->start_time, 0, 5),
            'end_time' => substr($this->end_time, 0, 5),
            'purpose' => $this->purpose,
            'participant_count' => $this->participant_count,
            'status' => $this->status,
            'admin_notes' => $this->admin_notes,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'room' => $this->whenLoaded('room', fn() => RoomResource::make($this->room)),
            'user' => $this->whenLoaded('user', fn() => $this->user->only(['id', 'name', 'email', 'role', 'nim', 'nip'])),
            'logs' => $this->whenLoaded('logs', fn() => $this->logs->map(fn($log) => [
                'previous_status' => $log->previous_status,
                'new_status' => $log->new_status,
                'notes' => $log->notes,
                'admin_id' => $log->admin_id,
                'created_at' => $log->created_at?->toIso8601String(),
            ])->values()),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}