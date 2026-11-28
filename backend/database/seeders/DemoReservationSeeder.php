<?php

namespace Database\Seeders;

use App\Models\Reservation;
use App\Models\Room;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DemoReservationSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            /*
             * 1. Target reservasi per ruangan
             * Total: 1.432
             */
            $roomTargets = [
                'GKU-1-2' => 716,
                'GKU-2-2' => 572,

                'GKU-1-3' => 36,
                'GKU-2-3' => 36,
                'GKU-3-3' => 36,
                'GKU-4-3' => 36,
            ];

            /*
             * 2. Target status reservasi
             */
            $statusTargets = [
                'approved'  => 931,
                'pending'   => 215,
                'rejected'  => 143,
                'cancelled' => 143,
            ];

            $totalTarget = array_sum($roomTargets);

            if ($totalTarget !== 1432) {
                throw new RuntimeException(
                    'Total target reservasi harus 1432.'
                );
            }

            /*
             * 3. Ambil ruangan
             */
            $rooms = Room::whereIn(
                'room_code',
                array_keys($roomTargets)
            )->get()->keyBy('room_code');

            foreach ($roomTargets as $roomCode => $target) {
                if (!$rooms->has($roomCode)) {
                    throw new RuntimeException(
                        "Ruangan {$roomCode} tidak ditemukan."
                    );
                }
            }

            /*
             * 4. Ambil akun mahasiswa dan dosen
             */
            $students = User::where('role', 'mahasiswa')
                ->orderBy('id')
                ->get();

            $lecturers = User::where('role', 'dosen')
                ->orderBy('id')
                ->get();

            $bookers = $students->concat($lecturers)->values();

            if ($bookers->isEmpty()) {
                throw new RuntimeException(
                    'Akun mahasiswa atau dosen tidak ditemukan.'
                );
            }

            $admin = User::where('role', 'admin')->first();

            if (!$admin) {
                throw new RuntimeException(
                    'Akun admin tidak ditemukan.'
                );
            }

            /*
             * 5. Hapus hanya reservasi demo sebelumnya
             */
            Reservation::where(
                'reservation_code',
                'like',
                'DEMO-ANALYTICS-%'
            )->delete();

            /*
             * 6. Periode data:
             * 16 minggu ke belakang dan 4 minggu ke depan.
             */
            $today = CarbonImmutable::today();

            $startDate = $today
                ->startOfWeek(Carbon::MONDAY)
                ->subWeeks(16);

            $endDate = $today
                ->startOfWeek(Carbon::MONDAY)
                ->addWeeks(4)
                ->addDays(4);

            /*
             * 7. Slot reservasi
             */
            $timeSlots = [
                ['07:30', '08:30'],
                ['08:45', '09:45'],
                ['10:00', '11:00'],
                ['11:15', '12:15'],
                ['12:30', '13:30'],
                ['13:45', '14:45'],
                ['15:00', '16:00'],
                ['16:15', '17:15'],
                ['17:30', '18:30'],
            ];

            /*
             * 8. Bobot aktivitas per hari
             * Selasa dan Rabu menjadi hari tersibuk.
             * Weekend tetap ada, khusus kegiatan Ormawa.
             */
            $dayWeights = [
                1 => 22, // Senin
                2 => 24, // Selasa
                3 => 23, // Rabu
                4 => 21, // Kamis
                5 => 10, // Jumat
                6 => 4,  // Sabtu
                7 => 1,  // Minggu
            ];

            /*
             * 9. Ambil reservasi asli yang berpotensi konflik.
             * Data demo lama sudah dihapus di atas.
             */
            $existingReservations = DB::table('reservations')
                ->whereIn('status', ['approved', 'pending'])
                ->whereBetween('reservation_date', [
                    $startDate->toDateString(),
                    $endDate->toDateString(),
                ])
                ->get([
                    'room_id',
                    'reservation_date',
                    'start_time',
                    'end_time',
                ]);

            $existingByRoom = [];

            foreach ($existingReservations as $reservation) {
                $key = $reservation->room_id
                    . '|'
                    . $reservation->reservation_date;

                $existingByRoom[$key][] = [
                    'start' => substr(
                        (string) $reservation->start_time,
                        0,
                        5
                    ),
                    'end' => substr(
                        (string) $reservation->end_time,
                        0,
                        5
                    ),
                ];
            }

            /*
             * 10. Buat kandidat reservasi per ruangan.
             */
            $selectedSlots = [];

            foreach ($roomTargets as $roomCode => $target) {
                $room = $rooms->get($roomCode);

                $weekdayCandidates = [];
                $weekendCandidates = [];

                for (
                    $date = $startDate;
                    $date->lte($endDate);
                    $date = $date->addDay()
                ) {
                    $weekday = $date->dayOfWeekIso;
                    $isWeekend = $weekday >= 6;

                    foreach ($timeSlots as $slot) {
                        [$startTime, $endTime] = $slot;

                        $key = $room->id
                            . '|'
                            . $date->toDateString();

                        /*
                         * Cek konflik dengan reservasi asli.
                         */
                        $hasConflict = false;

                        foreach (
                            $existingByRoom[$key] ?? []
                            as $existing
                        ) {
                            if (
                                $startTime < $existing['end']
                                && $endTime > $existing['start']
                            ) {
                                $hasConflict = true;
                                break;
                            }
                        }

                        if ($hasConflict) {
                            continue;
                        }

                        /*
                         * Weighted random berdasarkan hari.
                         * Tanggal mendatang sedikit diprioritaskan
                         * agar cukup untuk status pending.
                         */
                        $weight = $dayWeights[$weekday];

                        $random = mt_rand(
                            1,
                            1000000
                        ) / 1000000;

                        $score = -log($random) / $weight;

                        if ($date->gte($today)) {
                            $score *= 0.65;
                        }

                        $candidate = [
                            'room' => $room,
                            'date' => $date->toDateString(),
                            'start_time' => $startTime,
                            'end_time' => $endTime,
                            'score' => $score,
                            'is_weekend' => $isWeekend,
                        ];

                        if ($isWeekend) {
                            $weekendCandidates[] = $candidate;
                        } else {
                            $weekdayCandidates[] = $candidate;
                        }
                    }
                }

                /*
                 * 11. Alokasikan 8% target ruangan untuk weekend.
                 * Minimal satu slot weekend per ruangan.
                 */
                $weekendTarget = max(
                    1,
                    (int) round($target * 0.08)
                );

                $weekdayTarget = $target - $weekendTarget;

                /*
                 * Urutkan kandidat berdasarkan weighted score.
                 */
                usort(
                    $weekdayCandidates,
                    fn ($a, $b) => $a['score'] <=> $b['score']
                );

                usort(
                    $weekendCandidates,
                    fn ($a, $b) => $a['score'] <=> $b['score']
                );

                if (count($weekdayCandidates) < $weekdayTarget) {
                    throw new RuntimeException(
                        "Slot weekday tidak cukup untuk {$roomCode}. "
                        . "Dibutuhkan {$weekdayTarget}, tersedia "
                        . count($weekdayCandidates)
                    );
                }

                if (count($weekendCandidates) < $weekendTarget) {
                    throw new RuntimeException(
                        "Slot weekend tidak cukup untuk {$roomCode}. "
                        . "Dibutuhkan {$weekendTarget}, tersedia "
                        . count($weekendCandidates)
                    );
                }

                $roomWeekdaySlots = array_slice(
                    $weekdayCandidates,
                    0,
                    $weekdayTarget
                );

                $roomWeekendSlots = array_slice(
                    $weekendCandidates,
                    0,
                    $weekendTarget
                );

                $selectedSlots = array_merge(
                    $selectedSlots,
                    $roomWeekdaySlots,
                    $roomWeekendSlots
                );
            }

            /*
             * 12. Urutkan tanggal mendatang terlebih dahulu
             * supaya reservasi pending lebih banyak berada
             * pada tanggal mendatang.
             */
            usort($selectedSlots, function ($a, $b) use ($today) {
                $todayString = $today->toDateString();

                $aFuture = $a['date'] >= $todayString;
                $bFuture = $b['date'] >= $todayString;

                if ($aFuture !== $bFuture) {
                    return $aFuture ? -1 : 1;
                }

                return strcmp($a['date'], $b['date']);
            });

            if (count($selectedSlots) !== 1432) {
                throw new RuntimeException(
                    'Jumlah slot terpilih tidak sama dengan 1432.'
                );
            }

            /*
             * 13. Buat daftar status dengan jumlah tepat.
             */
            $pendingStatuses = array_fill(
                0,
                $statusTargets['pending'],
                'pending'
            );

            $otherStatuses = array_merge(
                array_fill(
                    0,
                    $statusTargets['approved'],
                    'approved'
                ),
                array_fill(
                    0,
                    $statusTargets['rejected'],
                    'rejected'
                ),
                array_fill(
                    0,
                    $statusTargets['cancelled'],
                    'cancelled'
                )
            );

            shuffle($otherStatuses);

            $statuses = array_merge(
                $pendingStatuses,
                $otherStatuses
            );

            /*
             * 14. Tujuan reservasi weekday dan weekend.
             */
            $weekdayPurposes = [
                'Perkuliahan',
                'Diskusi kelompok',
                'Seminar mahasiswa',
                'Presentasi tugas',
                'Rapat organisasi',
                'Workshop akademik',
                'Kegiatan akademik mahasiswa',
            ];

            $weekendPurposes = [
                'Rapat organisasi mahasiswa',
                'Kegiatan UKM kampus',
                'Rapat kepanitiaan acara kampus',
                'Workshop organisasi mahasiswa',
                'Persiapan kegiatan Ormawa',
                'Evaluasi program kerja Ormawa',
                'Kegiatan internal Ormawa',
            ];

            /*
             * 15. Buat data reservasi.
             */
            $rows = [];
            $sequence = 1;

            foreach ($selectedSlots as $index => $slot) {
                $status = $statuses[$index];

                $room = $slot['room'];

                $reservationDate = CarbonImmutable::parse(
                    $slot['date']
                );

                /*
                 * created_at tidak boleh berada di masa depan.
                 */
                $createdBase = $reservationDate->gt($today)
                    ? $today
                    : $reservationDate;

                $createdAt = $createdBase
                    ->subDays(mt_rand(1, 14))
                    ->setTime(
                        mt_rand(8, 16),
                        mt_rand(0, 59)
                    );

                $reviewedAt = null;
                $reviewedBy = null;
                $adminNotes = null;

                /*
                 * Approved dan rejected sudah direview admin.
                 */
                if (in_array(
                    $status,
                    ['approved', 'rejected'],
                    true
                )) {
                    $reviewedBy = $admin->id;

                    $reviewedAt = $createdAt
                        ->addHours(mt_rand(1, 24));

                    if (
                        $reviewedAt->gt(
                            $reservationDate->startOfDay()
                        )
                    ) {
                        $reviewedAt = $reservationDate
                            ->startOfDay()
                            ->subMinutes(mt_rand(1, 60));
                    }
                }

                if ($status === 'rejected') {
                    $rejectionReasons = [
                        'Jadwal ruangan tidak dapat disetujui.',
                        'Kapasitas ruangan tidak sesuai kebutuhan.',
                        'Fasilitas yang diminta tidak tersedia.',
                        'Permohonan tidak memenuhi ketentuan.',
                        'Ruangan digunakan untuk kegiatan kampus lain.',
                    ];

                    $adminNotes = $rejectionReasons[
                        array_rand($rejectionReasons)
                    ];
                }

                if ($status === 'cancelled') {
                    $adminNotes = 'Dibatalkan oleh pemesan.';
                }

                /*
                 * Weekend hanya untuk kegiatan Ormawa.
                 */
                if ($slot['is_weekend']) {
                    $purpose = $weekendPurposes[
                        array_rand($weekendPurposes)
                    ];
                } else {
                    $purpose = $weekdayPurposes[
                        array_rand($weekdayPurposes)
                    ];
                }

                /*
                 * Pemesan bergantian antara mahasiswa dan dosen.
                 */
                $user = $bookers[
                    ($sequence - 1) % $bookers->count()
                ];

                $participantCount = min(
                    (int) $room->capacity,
                    mt_rand(10, 45)
                );

                $rows[] = [
                    'reservation_code' => 'DEMO-ANALYTICS-'
                        . $reservationDate->format('Ymd')
                        . '-'
                        . str_pad(
                            (string) $sequence,
                            5,
                            '0',
                            STR_PAD_LEFT
                        ),

                    'user_id' => $user->id,
                    'room_id' => $room->id,
                    'reservation_date' => $slot['date'],
                    'start_time' => $slot['start_time'],
                    'end_time' => $slot['end_time'],
                    'purpose' => $purpose,
                    'participant_count' => $participantCount,
                    'status' => $status,
                    'admin_notes' => $adminNotes,
                    'reviewed_by' => $reviewedBy,
                    'reviewed_at' => $reviewedAt,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];

                $sequence++;
            }

            /*
             * 16. Insert secara bertahap.
             */
            foreach (array_chunk($rows, 200) as $chunk) {
                DB::table('reservations')->insert($chunk);
            }

            /*
             * 17. Verifikasi total data demo.
             */
            $actualCount = Reservation::where(
                'reservation_code',
                'like',
                'DEMO-ANALYTICS-%'
            )->count();

            if ($actualCount !== 1432) {
                throw new RuntimeException(
                    "Seeder menghasilkan {$actualCount}, "
                    . "seharusnya 1432."
                );
            }

            /*
             * 18. Verifikasi status.
             */
            $actualStatuses = Reservation::where(
                'reservation_code',
                'like',
                'DEMO-ANALYTICS-%'
            )
                ->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status')
                ->toArray();

            foreach ($statusTargets as $status => $expected) {
                if (
                    (int) ($actualStatuses[$status] ?? 0)
                    !== $expected
                ) {
                    throw new RuntimeException(
                        "Jumlah status {$status} tidak sesuai."
                    );
                }
            }
        });

        $this->command?->info(
            'Berhasil membuat 1.432 reservasi demo.'
        );

        $this->command?->info(
            'Status: 931 approved, 215 pending, '
            . '143 rejected, 143 cancelled.'
        );

        $this->command?->info(
            'Reservasi weekend dialokasikan untuk kegiatan Ormawa.'
        );
    }
}
