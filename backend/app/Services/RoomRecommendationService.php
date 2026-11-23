<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\Room;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class RoomRecommendationService
{
    /**
     * Recommend available rooms based on user requirements.
     *
     * All availability checks are performed by Laravel.
     * DeepSeek will only explain the recommendation results.
     */
    public function recommend(array $criteria): array
    {
        $reservationDate = $criteria['reservation_date'];

        $startTime = $this->normalizeTime(
            $criteria['start_time']
        );

        $endTime = $this->normalizeTime(
            $criteria['end_time']
        );

        $openingTime = config('room.operating_hours.start') . ':00';
        $closingTime = config('room.operating_hours.end') . ':00';
        if (
          $startTime < $openingTime ||
          $endTime > $closingTime ||
          $endTime <= $startTime
      ) {
      throw ValidationException::withMessages([
        'start_time' => [
          'Peminjaman hanya diperbolehkan pada jam operasional '
          . config('room.operating_hours.start')
          . ' sampai '
          . config('room.operating_hours.end')
          . '.',
          ],
        ]);
      }

        $participantCount = (int) $criteria['participant_count'];

        $facilityIds = collect($criteria['facilities'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        // Find available rooms that meet the capacity requirement.
        $query = Room::query()
            ->where('status', 'available')
            ->where('capacity', '>=', $participantCount)
            ->with('facilities:id,name');

        // Every requested facility must exist in the room.
        if (!empty($facilityIds)) {
            $query->whereHas(
                'facilities',
                fn ($facilityQuery) => $facilityQuery
                    ->whereIn('facilities.id', $facilityIds),
                '=',
                count($facilityIds)
            );
        }

        $candidates = $query->get();

        $recommendations = [];

        $conflictCount = 0;

        foreach ($candidates as $room) {

            // Check pending and approved reservations.
            if (Reservation::slotTaken(
                $room->id,
                $reservationDate,
                $startTime,
                $endTime
            )) {
                $conflictCount++;

                continue;
            }

            $matchReasons = [
                "Kapasitas mencukupi untuk {$participantCount} peserta.",
                !empty($facilityIds)
                    ? 'Seluruh fasilitas yang diminta tersedia.'
                    : 'Ruangan memenuhi kebutuhan kapasitas.',
                'Tidak ada bentrok dengan reservasi yang sedang memblokir jadwal.',
            ];

            $recommendations[] = [
                'room_id' => $room->id,
                'room_code' => $room->room_code,
                'room_name' => $room->room_name,
                'building' => $room->building,
                'floor' => $room->floor,
                'capacity' => $room->capacity,

                'capacity_remaining' =>
                    $room->capacity - $participantCount,

                'facilities' => $room->facilities
                    ->map(fn ($facility) => [
                        'id' => $facility->id,
                        'name' => $facility->name,
                    ])
                    ->values()
                    ->all(),

                'match_reasons' => $matchReasons,
            ];
        }

        /*
         * Prefer rooms with the smallest sufficient capacity.
         * This helps avoid recommending unnecessarily large rooms.
         */
        $recommendations = collect($recommendations)
            ->sortBy('capacity_remaining')
            ->values()
            ->map(function ($room, $index) {
                $room['rank'] = $index + 1;

                return $room;
            })
            ->all();

        if (count($recommendations) > 0) {
            $message = 'Ditemukan ruangan yang sesuai dengan kebutuhan Anda.';
        } elseif ($candidates->isEmpty()) {
            $message = 'Tidak ditemukan ruangan yang memenuhi kapasitas dan fasilitas yang diminta.';
        } else {
            $message = 'Ruangan yang sesuai ditemukan, tetapi jadwalnya berbenturan dengan reservasi lain.';
        }

        return [
            'algorithm' => 'rule_based_room_matching',

            'criteria' => [
                'reservation_date' => $reservationDate,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'participant_count' => $participantCount,
                'facility_ids' => $facilityIds,
            ],

            'total_candidates' => $candidates->count(),
            'schedule_conflicts' => $conflictCount,
            'total_recommendations' => count($recommendations),

            'message' => $message,

            'recommendations' => $recommendations,
        ];
    }

    /**
     * Normalize time from H:i to H:i:s.
     */
    private function normalizeTime(string $time): string
    {
        return strlen($time) === 5
            ? $time . ':00'
            : $time;
    }
}
