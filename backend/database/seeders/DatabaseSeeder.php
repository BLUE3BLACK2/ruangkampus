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
        // Password comes from .env (SEED_PASSWORD) so no credential lives in the
        // repository. Without it a random one is generated and printed once.
        $password = env('SEED_PASSWORD') ?: Str::password(16);
        $generated = ! env('SEED_PASSWORD');

        // 1. Seed akun pengguna
        $accounts = [
            ['admin@ruangkuliah.test', 'Admin', 'admin', null, null],
            ['prema@ruangkuliah.test', 'Premadharma', 'mahasiswa', '2415101056', null],
            ['agus@ruangkuliah.test', 'Ir. Ketut Agus Seputra, S.ST., M.T.', 'dosen', null, '199008152019031018'],
        ];

        foreach ($accounts as [$email, $name, $role, $nim, $nip]) {
            User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make($password),
                    'role' => $role,
                    'nim' => $nim,
                    'nip' => $nip,
                ]
            );
        }

        if ($generated) {
            $this->command?->warn("SEED_PASSWORD tidak di-set. Password akun seed: {$password}");
        }

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
