<?php

namespace Database\Seeders;

use App\Models\Facility;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed akun pengguna
        User::updateOrCreate(
            ['email' => 'admin@ruangkuliah.test'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        User::updateOrCreate(
            ['email' => 'prema@ruangkuliah.test'],
            [
                'name' => 'Premadharma',
                'password' => Hash::make('password'),
                'role' => 'mahasiswa',
                'nim' => '2415101056',
            ]
        );

        User::updateOrCreate(
            ['email' => 'agus@ruangkuliah.test'],
            [
                'name' => 'Ir. Ketut Agus Seputra, S.ST., M.T.',
                'password' => Hash::make('password'),
                'role' => 'dosen',
                'nip' => ' 199008152019031018',
            ]
        );

        // 2. Seed fasilitas
        $facilityData = [
            ['Proyektor', 'Proyektor presentasi'],
            ['Whiteboard', 'Papan tulis putih'],
            ['AC', 'Pendingin ruangan'],
            ['Sound System', 'Pengeras suara'],
            ['WiFi', 'Akses internet'],
        ];

        $facilities = collect($facilityData)->map(
            fn (array $f) => Facility::updateOrCreate(
                ['name' => $f[0]],
                ['description' => $f[1]]
            )
        );

        // 3. Seed ruangan
        $roomData = [
            [
                'R-101', 'Ruang Kelas 101', 'Gedung A',
                1, 40, 'Ruang kelas standar',
                ['Proyektor', 'AC', 'Whiteboard']
            ],
            [
                'R-102', 'Ruang Kelas 102', 'Gedung A',
                1, 40, 'Ruang kelas standar',
                ['Proyektor', 'AC', 'Whiteboard']
            ],
            [
                'LAB-KOM', 'Laboratorium Komputer', 'Gedung B',
                2, 30, 'Lab komputer 30 PC',
                ['AC', 'WiFi']
            ],
            [
                'AUD-1', 'Aula Serbaguna', 'Gedung C',
                1, 200, 'Aula untuk acara besar',
                ['Proyektor', 'Sound System', 'AC', 'WiFi']
            ],
            [
                'SEM-1', 'Ruang Seminar 1', 'Gedung B',
                3, 60, 'Ruang seminar',
                ['Proyektor', 'AC', 'Sound System']
            ],
        ];

        foreach ($roomData as [
            $code,
            $name,
            $building,
            $floor,
            $capacity,
            $desc,
            $facilityNames
        ]) {
            $room = Room::updateOrCreate(
                ['room_code' => $code],
                [
                    'room_name' => $name,
                    'building' => $building,
                    'floor' => $floor,
                    'capacity' => $capacity,
                    'description' => $desc,
                    'status' => 'available',
                ]
            );

            $room->facilities()->sync(
                $facilities
                    ->whereIn('name', $facilityNames)
                    ->pluck('id')
            );
        }
    }
}
