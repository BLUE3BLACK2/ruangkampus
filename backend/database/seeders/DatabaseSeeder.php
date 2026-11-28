<?php

namespace Database\Seeders;

use App\Models\Facility;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // This seeder contains demo accounts, rooms, and reservations.
        // Never run it against production data.
        if (!app()->environment(['local', 'testing'])) {
            $this->command?->warn(
                'Demo DatabaseSeeder skipped. Only local/testing environments are allowed.'
            );

            return;
        }

        // Use one password for all demo accounts.
        // Set SEED_PASSWORD in .env for a predictable local password.
        $password = env('SEED_PASSWORD') ?: Str::password(16);
        $generated = !env('SEED_PASSWORD');

        /*
        |--------------------------------------------------------------------------
        | 1. Seed users
        |--------------------------------------------------------------------------
        |
        | The administrator is displayed as "Pengelola Gedung".
        | Its internal role remains "admin" to preserve middleware access.
        |
        */

        $accounts = [
            [
                'email' => 'admin@ruangkuliah.test',
                'name' => 'Pengelola Gedung',
                'role' => 'admin',
                'nim' => null,
                'nip' => null,
            ],
            [
                'email' => 'prema@ruangkuliah.test',
                'name' => 'Premadharma',
                'role' => 'mahasiswa',
                'nim' => '2415101056',
                'nip' => null,
            ],
            [
                'email' => 'rubby@ruangkuliah.test',
                'name' => 'Rubby Aprilia',
                'role' => 'mahasiswa',
                'nim' => '2415101057',
                'nip' => null,
            ],
            [
                'email' => 'kenia@ruangkuliah.test',
                'name' => 'Kenia Queen',
                'role' => 'mahasiswa',
                'nim' => '2415101058',
                'nip' => null,
            ],
            [
                'email' => 'acil@ruangkuliah.test',
                'name' => 'Arya Darma',
                'role' => 'mahasiswa',
                'nim' => '2415101059',
                'nip' => null,
            ],
            [
                'email' => 'agus@ruangkuliah.test',
                'name' => 'Ir. Ketut Agus Seputra, S.ST., M.T.',
                'role' => 'dosen',
                'nim' => null,
                'nip' => '199008152019031018',
            ],
            [
                'email' => 'wahyu@ruangkuliah.test',
                'name' => 'Wahyu Wijaya',
                'role' => 'dosen',
                'nim' => null,
                'nip' => '198910262019031004',
            ],
        ];

        foreach ($accounts as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make($password),
                    'role' => $account['role'],
                    'nim' => $account['nim'],
                    'nip' => $account['nip'],
                ]
            );
        }

        if ($generated) {
            $this->command?->warn(
                "SEED_PASSWORD is not configured. Generated demo password: {$password}"
            );
        }

        /*
        |--------------------------------------------------------------------------
        | 2. Seed facilities
        |--------------------------------------------------------------------------
        */

        $facilityData = [
            ['Proyektor', 'Proyektor presentasi'],
            ['Whiteboard', 'Papan tulis putih'],
            ['AC', 'Pendingin ruangan'],
            ['Sound System', 'Pengeras suara'],
            ['WiFi', 'Akses internet'],
        ];

        $facilities = collect($facilityData)->map(
            fn (array $facility) => Facility::updateOrCreate(
                ['name' => $facility[0]],
                ['description' => $facility[1]]
            )
        );

        // Standard facilities assigned to every GKU classroom.
        $classroomFacilityIds = $facilities
            ->whereIn('name', [
                'Proyektor',
                'Whiteboard',
                'AC',
                'WiFi',
            ])
            ->pluck('id')
            ->all();

        /*
        |--------------------------------------------------------------------------
        | 3. Seed GKU rooms
        |--------------------------------------------------------------------------
        |
        | Four rooms on each floor:
        | Floor 1 = 30 participants
        | Floor 2 = 50 participants
        | Floor 3 = 65 participants
        |
        */

        $floorCapacities = [
            1 => 30,
            2 => 50,
            3 => 65,
        ];

        foreach ($floorCapacities as $floor => $capacity) {
            for ($roomNumber = 1; $roomNumber <= 4; $roomNumber++) {
                $roomName = "Ruang {$roomNumber}-{$floor}";
                $roomCode = "GKU-{$roomNumber}-{$floor}";

                $room = Room::updateOrCreate(
                    ['room_code' => $roomCode],
                    [
                        'room_name' => $roomName,
                        'building' => 'GKU',
                        'floor' => $floor,
                        'capacity' => $capacity,
                        'description' =>
                            "Ruang kuliah GKU lantai {$floor}, kapasitas {$capacity} orang.",
                        'status' => 'available',
                    ]
                );

                $room->facilities()->sync($classroomFacilityIds);
            }
        }

        $this->command?->info(
            'GKU room seeding completed. Total configured rooms: 12.'
        );

        /*
        |--------------------------------------------------------------------------
        | 4. Seed demo reservations
        |--------------------------------------------------------------------------
        */

        $this->call(DemoReservationSeeder::class);

        /*
        |--------------------------------------------------------------------------
        | 5. Remove unused legacy rooms from the previous dataset
        |--------------------------------------------------------------------------
        |
        | Only known old demo room codes are considered.
        | Rooms that still have reservation history are preserved.
        |
        */

        $legacyRoomCodes = [
            'R-101',
            'R-102',
            'LAB-KOM',
            'AUD-1',
            'SEM-1',
        ];

        $legacyRooms = Room::whereIn(
            'room_code',
            $legacyRoomCodes
        )->get();

        foreach ($legacyRooms as $legacyRoom) {
            if ($legacyRoom->reservations()->exists()) {
                $this->command?->warn(
                    "Legacy room {$legacyRoom->room_code} was preserved because it still has reservation records."
                );

                continue;
            }

            $legacyRoom->facilities()->detach();
            $legacyRoom->delete();

            $this->command?->info(
                "Removed unused legacy room: {$legacyRoom->room_code}"
            );
        }

        $this->command?->info(
            'RuangKuliah demo database seeding completed.'
        );
    }
}
