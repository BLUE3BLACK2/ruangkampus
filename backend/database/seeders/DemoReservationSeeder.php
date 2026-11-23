<?php

namespace Database\Seeders;

use App\Models\Reservation;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DemoReservationSeeder extends Seeder
{
    public function run(): void
    {
        // Demo data must never be inserted into production.
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException(
                'DemoReservationSeeder can only run in local or testing environments.'
            );
        }

        $admin = User::where('role', 'admin')->first();

        $bookers = User::whereIn('role', ['mahasiswa', 'dosen'])
            ->orderBy('id')
            ->get();

        $rooms = Room::where('status', 'available')
            ->orderBy('id')
            ->get()
            ->values();

        if (! $admin || $bookers->isEmpty() || $rooms->isEmpty()) {
            throw new RuntimeException(
                'Admin, booking users, and available rooms must exist before seeding.'
            );
        }

        $today = now()->startOfDay()->toImmutable();

        $createdCount = 0;
        $existingCount = 0;

        DB::transaction(function () use (
            $today,
            $admin,
            $bookers,
            $rooms,
            &$createdCount,
            &$existingCount
        ) {
            // Generate historical data for the previous 27 days.
            for ($daysAgo = 27; $daysAgo >= 1; $daysAgo--) {
                $date = $today->subDays($daysAgo);

                // Generate one to three reservations per day.
                $weekNumber = (int) $date->format('W');

                $bookingCount = 1 + (
                    ($date->dayOfWeekIso + $weekNumber) % 3
                );

                for ($index = 0; $index < $bookingCount; $index++) {
                    // Use different rooms to avoid overlapping demo slots.
                    $room = $rooms->get(
                        ($daysAgo + $index) % $rooms->count()
                    );

                    // Alternate between the existing student and lecturer.
                    $booker = $bookers->get(
                        ($daysAgo + $index) % $bookers->count()
                    );

                    $startHour = 8 + ($index * 2);
                    $endHour = $startHour + 1;

                    $reservationCode = sprintf(
                        'DEMO-ANALYTICS-%s-%02d',
                        $date->format('Ymd'),
                        $index + 1
                    );

                    $bookingTime = $date->setTime(6, 0);

                    $reservation = Reservation::firstOrCreate(
                        [
                            'reservation_code' => $reservationCode,
                        ],
                        [
                            'user_id' => $booker->id,
                            'room_id' => $room->id,
                            'reservation_date' => $date->toDateString(),
                            'start_time' => sprintf(
                                '%02d:00:00',
                                $startHour
                            ),
                            'end_time' => sprintf(
                                '%02d:30:00',
                                $endHour
                            ),
                            'purpose' => '[DEMO] Academic activities for AI analytics testing',
                            'participant_count' => min(
                                $room->capacity,
                                18 + ($index * 5)
                            ),
                            'status' => 'approved',
                            'admin_notes' => '[DEMO] Generated historical reservation.',
                            'reviewed_by' => $admin->id,
                            'reviewed_at' => $date->setTime(7, 0),
                            'created_at' => $bookingTime,
                            'updated_at' => $bookingTime,
                        ]
                    );

                    if ($reservation->wasRecentlyCreated) {
                        $createdCount++;
                    } else {
                        $existingCount++;
                    }
                }
            }
        });

        $this->command?->info(
            "Demo reservation seeding completed. Created: {$createdCount}, Existing: {$existingCount}."
        );
    }
}
