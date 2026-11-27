<?php

namespace App\Services;

use App\Models\Reservation;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class RoomUsageAnalyticsService
{
    public function __construct(
        private RoomUsagePredictionService $predictionService,
        private DeepSeekInsightService $deepSeekService,
    ) {
    }

    /**
     * Get reservation statistics from the historical period.
     *
     * Usage statistics are based on approved reservations.
     * Status statistics include every reservation status
     * within the exact same historical period.
     */
    public function overview(): array
    {
        [$startDate, $endDate] = $this->historicalPeriod();

        /*
         * 1. Query reservasi approved untuk analisis penggunaan.
         */
        $approvedQuery = Reservation::query()
            ->where('status', 'approved')
            ->whereBetween('reservation_date', [
                $startDate,
                $endDate,
            ]);

        $totalApprovedReservations = (clone $approvedQuery)->count();

        $totalParticipants = (int) (clone $approvedQuery)
            ->sum('participant_count');

        /*
         * 2. Hitung semua status dalam periode historis yang sama.
         *
         * Jangan menggunakan total seluruh dataset sebagai
         * denominator approval rate historis.
         */
        $historicalStatusBreakdown = $this->getStatusBreakdown(
            Reservation::query()
                ->whereBetween('reservation_date', [
                    $startDate,
                    $endDate,
                ])
                ->selectRaw(
                    'LOWER(status) AS reservation_status,
                     COUNT(*) AS total'
                )
                ->groupByRaw('LOWER(status)')
                ->get()
        );

        $historicalTotalReservations = array_sum(
            $historicalStatusBreakdown
        );

        $historicalApprovalRate = $historicalTotalReservations > 0
            ? round(
                (
                    $totalApprovedReservations
                    / $historicalTotalReservations
                ) * 100,
                2
            )
            : null;

        /*
         * 3. Data harian approved.
         *
         * Query awal mengambil tanggal yang memiliki record;
         * setelah itu tanggal kosong dilengkapi dengan nilai 0
         * berdasarkan rentang tanggal query yang sama.
         */
        $dailyRows = (clone $approvedQuery)
            ->selectRaw(
                'DATE(reservation_date) AS reservation_day,
                 COUNT(*) AS total_reservations'
            )
            ->groupBy('reservation_day')
            ->orderBy('reservation_day')
            ->get();

        /*
         * Lengkapi tanggal dalam periode historis, termasuk tanggal
         * tanpa reservasi approved. Query database mengetahui tanggal
         * tersebut memang bernilai 0 dalam scope yang sedang dihitung.
         */
        $dailyCounts = $dailyRows
            ->mapWithKeys(fn ($row) => [
                (string) $row->reservation_day =>
                    (int) $row->total_reservations,
            ])
            ->all();

        $completeDailyRows = collect();
        $cursor = CarbonImmutable::parse($startDate);
        $lastDate = CarbonImmutable::parse($endDate);

        while ($cursor->lessThanOrEqualTo($lastDate)) {
            $date = $cursor->toDateString();

            $completeDailyRows->push((object) [
                'reservation_day' => $date,
                'total_reservations' => $dailyCounts[$date] ?? 0,
            ]);

            $cursor = $cursor->addDay();
        }

        $dailyRows = $completeDailyRows;

        /*
         * 4. Distribusi seluruh ruangan.
         *
         * LEFT JOIN digunakan supaya ruangan dengan nol
         * reservasi approved tetap muncul.
         */
        $roomRows = DB::table('rooms')
            ->leftJoin('reservations', function ($join) use (
                $startDate,
                $endDate
            ) {
                $join->on(
                    'rooms.id',
                    '=',
                    'reservations.room_id'
                )
                    ->where(
                        'reservations.status',
                        '=',
                        'approved'
                    )
                    ->whereBetween(
                        'reservations.reservation_date',
                        [$startDate, $endDate]
                    );
            })
            ->select([
                'rooms.id AS room_id',
                'rooms.room_code',
                'rooms.room_name',
            ])
            ->selectRaw(
                'COUNT(reservations.id) AS total_reservations'
            )
            ->groupBy(
                'rooms.id',
                'rooms.room_code',
                'rooms.room_name'
            )
            ->orderByDesc('total_reservations')
            ->orderBy('rooms.room_code')
            ->get();

        $roomDistribution = $roomRows
            ->map(fn ($row) => [
                'room_id' => (int) $row->room_id,
                'room_code' => $row->room_code,
                'room_name' => $row->room_name,
                'total_reservations' => (int) $row->total_reservations,
            ])
            ->values();

        $roomDistributionTotal = (int) $roomDistribution
            ->sum('total_reservations');

        /*
         * Tetap sediakan top 5 untuk kompatibilitas frontend lama.
         */
        $mostReservedRooms = $roomDistribution
            ->take(5)
            ->values()
            ->all();

        /*
         * 5. Cari hari tersibuk.
         */
        $maximumDailyReservations = (int) $dailyRows
            ->max('total_reservations');

        $busiestDays = $maximumDailyReservations > 0
            ? $dailyRows
                ->filter(
                    fn ($row) => (int) $row->total_reservations
                        === $maximumDailyReservations
                )
                ->values()
            : collect();

        // Field tunggal tetap dipertahankan untuk frontend lama.
        $busiestDay = $busiestDays->first();

        /*
         * 6. Ringkasan dataset demo seluruh tanggal.
         *
         * Data ini boleh mencakup tanggal historis dan mendatang.
         * Karena itu, TIDAK boleh dipakai sebagai denominator
         * approval rate pada periode historis.
         */
        $demoDatasetSummary = $this->demoDatasetSummary();

        /*
         * 7. Return analytics.
         *
         * Field lama tetap dipertahankan.
         * Field baru menambahkan konteks statistik yang benar.
         */
        return [
            'historical_period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],

            'data_source' => $this->detectDataSource(
                $startDate,
                $endDate
            ),

            'data_basis' => 'approved_reservations',

            /*
             * Statistik approved untuk penggunaan ruangan.
             */
            'total_approved_reservations' => $totalApprovedReservations,

            /*
             * participant_count merupakan rencana jumlah peserta,
             * bukan bukti jumlah peserta yang benar-benar hadir.
             */
            'total_participants' => $totalParticipants,

            'participant_count_basis' => 'planned_participants_not_actual_attendance',

            /*
             * Statistik seluruh status dalam periode historis.
             */
            'historical_total_reservations' => $historicalTotalReservations,

            'historical_status_breakdown' => $historicalStatusBreakdown,

            'historical_approval_rate_percent' => $historicalApprovalRate,

            'historical_status_scope' => 'all_statuses_within_historical_period',

            /*
             * Ringkasan dataset demo secara keseluruhan.
             * Bukan denominator approval rate historis.
             */
            'demo_dataset_summary' => $demoDatasetSummary,

            /*
             * Validasi jumlah distribusi ruangan.
             */
            'room_distribution' => $roomDistribution->all(),

            'room_distribution_total_approved' => $roomDistributionTotal,

            'room_distribution_matches_approved_total' =>
                $roomDistributionTotal === $totalApprovedReservations,

            /*
             * Hari tersibuk.
             */
            'busiest_day' => $busiestDay ? [
                'date' => $busiestDay->reservation_day,

                'day_name' => CarbonImmutable::parse(
                    $busiestDay->reservation_day
                )->locale('id')->dayName,

                'total_reservations' => (int) $busiestDay->total_reservations,
            ] : null,

            // Semua tanggal dengan nilai maksimum, termasuk jika seri.
            'busiest_days' => $busiestDays
                ->map(fn ($row) => [
                    'date' => $row->reservation_day,
                    'day_name' => CarbonImmutable::parse(
                        $row->reservation_day
                    )->locale('id')->dayName,
                    'total_reservations' => (int) $row->total_reservations,
                ])
                ->all(),

            /*
             * Semua tanggal dalam periode ditampilkan.
             * Nilai 0 berasal dari query approved untuk tanggal tersebut.
             */
            'daily_reservations' => $dailyRows
                ->map(fn ($row) => [
                    'date' => $row->reservation_day,
                    'total_reservations' => (int) $row->total_reservations,
                ])
                ->values()
                ->all(),

            'daily_reservations_includes_zero_dates' => true,

            /*
             * Top 5 ruangan tetap tersedia untuk frontend lama.
             */
            'most_reserved_rooms' => $mostReservedRooms,
        ];
    }

    /**
     * Get seven-day reservation predictions.
     */
    public function predictions(): array
    {
        return $this->predictionService->predictNextSevenDays();
    }

    /**
     * Generate AI insights using aggregated analytics data.
     */
    public function generateInsights(): array
    {
        $prediction = $this->predictions();

        /*
         * Overview tetap disiapkan agar informasi status
         * historis dapat ditampilkan meskipun prediksi tidak tersedia.
         */
        $overview = $this->overview();

        /*
         * Jangan mengonsumsi token AI jika tidak ada
         * data historis approved yang cukup.
         */
        if (!($prediction['history_available'] ?? false)) {
            return [
                'status' => 'insufficient_data',
                'message' => 'Belum tersedia data historis untuk menghasilkan AI Insights.',
                'data_source' => $overview['data_source'],
                'overview' => $overview,
                'prediction' => $prediction,
                'insight' => null,
            ];
        }

        /*
         * Semua data dikirim sebagai agregat.
         * Tidak mengirim nama, email, NIM, atau identitas pemesan.
         */
        $analyticsData = [
            'analysis_type' => 'room_usage_forecast',

            'data_source' => $overview['data_source'],

            'historical_overview' => $overview,

            'forecast' => $prediction,
        ];

        try {
            $aiResult = $this->deepSeekService->generateInsights(
                $analyticsData
            );

            return [
                'status' => 'success',
                'message' => 'AI Insights berhasil dibuat.',
                'data_source' => $overview['data_source'],

                'overview' => $overview,

                'prediction' => $prediction,

                'insight' => [
                    'model' => $aiResult['model']
                        ?? config('services.datio.model_id'),

                    'content' => $aiResult['content'],

                    'usage' => $aiResult['usage'] ?? [],
                ],
            ];
        } catch (Throwable $exception) {
            /*
             * Jangan mencatat API key atau data sensitif.
             */
            Log::warning(
                'Room analytics AI insight generation failed.',
                [
                    'exception_type' => get_class($exception),
                    'message' => $exception->getMessage(),
                ]
            );

            return [
                'status' => 'ai_unavailable',

                'message' => 'AI Insights sementara tidak tersedia. Statistik dan prediksi tetap dapat digunakan.',

                'overview' => $overview,

                'prediction' => $prediction,

                'insight' => null,
            ];
        }
    }

    /**
     * Format grouped reservation statuses.
     *
     * Default statuses are included even when their count is zero.
     * Any additional status found in the database is also retained.
     */
    private function getStatusBreakdown(iterable $rows): array
    {
        $breakdown = [
            'approved' => 0,
            'pending' => 0,
            'rejected' => 0,
            'cancelled' => 0,
        ];

        foreach ($rows as $row) {
            $status = strtolower(
                trim((string) $row->reservation_status)
            );

            $status = $status !== '' ? $status : 'unknown';

            $breakdown[$status] = (int) $row->total;
        }

        return $breakdown;
    }

    /**
     * Get the total demo dataset across all dates.
     *
     * This is a separate scope from the historical analytics period.
     */
    private function demoDatasetSummary(): array
    {
        $query = Reservation::query()
            ->where(
                'reservation_code',
                'like',
                'DEMO-ANALYTICS-%'
            );

        $totalReservations = (clone $query)->count();

        $statusRows = (clone $query)
            ->selectRaw(
                'LOWER(status) AS reservation_status,
                 COUNT(*) AS total'
            )
            ->groupByRaw('LOWER(status)')
            ->get();

        $statusBreakdown = $this->getStatusBreakdown(
            $statusRows
        );

        $period = (clone $query)
            ->selectRaw(
                'MIN(reservation_date) AS start_date,
                 MAX(reservation_date) AS end_date'
            )
            ->first();

        return [
            'scope' => 'all_demo_records_across_all_dates',

            'total_reservations' => $totalReservations,

            'status_breakdown' => $statusBreakdown,

            'period' => [
                'start_date' => $period?->start_date,
                'end_date' => $period?->end_date,
            ],

            'interpretation_note' =>
                'Total dataset demo ini mencakup seluruh tanggal, termasuk tanggal di luar periode historis. Jangan gunakan total ini sebagai denominator approval rate historis.',
        ];
    }

    /**
     * Get the same historical period used by the prediction service.
     */
    private function historicalPeriod(): array
    {
        $today = now()->startOfDay()->toImmutable();

        $startDate = $today
            ->addDay()
            ->subWeeks(4);

        $endDate = $today->subDay();

        return [
            $startDate->toDateString(),
            $endDate->toDateString(),
        ];
    }

    /**
     * Identify whether the historical records are demo or operational.
     */
    private function detectDataSource(
        string $startDate,
        string $endDate
    ): string {
        $baseQuery = Reservation::query()
            ->where('status', 'approved')
            ->whereBetween('reservation_date', [
                $startDate,
                $endDate,
            ]);

        $total = (clone $baseQuery)->count();

        if ($total === 0) {
            return 'no_data';
        }

        $demoCount = (clone $baseQuery)
            ->where(
                'reservation_code',
                'like',
                'DEMO-ANALYTICS-%'
            )
            ->count();

        if ($demoCount === $total) {
            return 'demo';
        }

        if ($demoCount > 0) {
            return 'mixed';
        }

        return 'operational';
    }
}
