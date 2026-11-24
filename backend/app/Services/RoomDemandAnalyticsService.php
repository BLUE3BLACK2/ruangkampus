<?php

namespace App\Services;

use App\Models\Reservation;
use Carbon\CarbonImmutable;

class RoomDemandAnalyticsService
{
    /**
     * Analyze reservation demand by time interval
     * for a specific requested date.
     */
    public function analyzeDate(string $requestedDate): array
    {
        $timezone = 'Asia/Makassar';

        $targetDate = CarbonImmutable::createFromFormat(
            '!Y-m-d',
            $requestedDate,
            $timezone
        );

        $today = CarbonImmutable::now($timezone)->startOfDay();

        if (!$targetDate || $targetDate->lessThan($today)) {
            throw new \InvalidArgumentException(
                'Tanggal analisis harus hari ini atau tanggal mendatang.'
            );
        }

        $historyWeeks = (int) config(
            'room.assistant.trend_history_weeks',
            8
        );

        $minimumWeeks = (int) config(
            'room.assistant.minimum_history_weeks',
            3
        );

        $bucketMinutes = (int) config(
            'room.assistant.trend_bucket_minutes',
            120
        );

        $openingMinutes = $this->timeToMinutes(
            config('room.operating_hours.start', '07:30')
        );

        $closingMinutes = $this->timeToMinutes(
            config('room.operating_hours.end', '19:00')
        );

        if (
            $bucketMinutes < 1 ||
            $openingMinutes >= $closingMinutes
        ) {
            throw new \RuntimeException(
                'Room demand analytics configuration is invalid.'
            );
        }

        // Collect the same weekdays from previous weeks.
        // Future dates are excluded from historical observations.
        $historyDates = [];

        for ($week = 1; $week <= $historyWeeks; $week++) {
            $sampleDate = $targetDate->subWeeks($week);

            if ($sampleDate->lessThan($today)) {
                $historyDates[] = $sampleDate->toDateString();
            }
        }

        // Retrieve only approved historical reservations.
        $reservations = Reservation::query()
            ->where('status', 'approved')
            ->whereIn('reservation_date', $historyDates)
            ->get([
                'reservation_code',
                'reservation_date',
                'start_time',
                'end_time',
                'room_id',
            ]);

        // Group reservations by their historical date.
        $reservationsByDate = $reservations->groupBy(
            fn ($reservation) => $reservation
                ->reservation_date
                ->toDateString()
        );

        // Count only historical dates that contain
        // at least one approved reservation.
        $observedDates = $reservationsByDate->keys()->values()->all();

        $sampleCount = count($observedDates);

        // Build operational time intervals.
        $buckets = [];

        for (
            $start = $openingMinutes;
            $start < $closingMinutes;
            $start += $bucketMinutes
        ) {
            $end = min(
                $start + $bucketMinutes,
                $closingMinutes
            );

            $buckets[] = [
                'start' => $start,
                'end' => $end,
            ];
        }

        // Determine the data source for transparency.
        $demoCount = $reservations
            ->filter(fn ($reservation) =>
                str_starts_with(
                    $reservation->reservation_code,
                    'DEMO-ANALYTICS-'
                )
            )
            ->count();

        $dataSource = match (true) {
            $reservations->isEmpty() => 'no_data',
            $demoCount === $reservations->count() => 'demo',
            $demoCount > 0 => 'mixed',
            default => 'operational',
        };

        $historyAvailable = $sampleCount >= $minimumWeeks;

        $bucketResults = [];

        foreach ($buckets as $bucket) {
            $dailyCounts = [];

            // Count reservations overlapping each time interval.
            foreach ($observedDates as $sampleDate) {
                $dateReservations = $reservationsByDate->get(
                    $sampleDate,
                    collect()
                );

                $count = $dateReservations
                    ->filter(function ($reservation) use ($bucket) {
                        $reservationStart = $this->timeToMinutes(
                            $reservation->start_time
                        );

                        $reservationEnd = $this->timeToMinutes(
                            $reservation->end_time
                        );

                        // Standard interval overlap:
                        // reservation.start < bucket.end
                        // AND reservation.end > bucket.start
                        return $reservationStart < $bucket['end']
                            && $reservationEnd > $bucket['start'];
                    })
                    ->count();

                $dailyCounts[] = [
                    'date' => $sampleDate,
                    'reservations' => $count,
                ];
            }

            $totalReservations = collect($dailyCounts)
                ->sum('reservations');

            $average = $sampleCount > 0
                ? $totalReservations / $sampleCount
                : null;

            $bucketResults[] = [
                'start_time' => $this->minutesToTime(
                    $bucket['start']
                ),

                'end_time' => $this->minutesToTime(
                    $bucket['end']
                ),

                'total_reservations' => $totalReservations,

                'average_reservations' => $historyAvailable
                    ? round($average, 2)
                    : null,

                'observation_count' => $sampleCount,

                'daily_counts' => $dailyCounts,
            ];
        }

        // Classify demand relative to other intervals
        // on the same weekday, not as absolute occupancy.
        $validAverages = collect($bucketResults)
            ->pluck('average_reservations')
            ->filter(fn ($value) => $value !== null)
            ->values();

        $maximumAverage = $validAverages->max() ?? 0;

        foreach ($bucketResults as &$bucket) {
            if (!$historyAvailable) {
                $bucket['demand_level'] = 'insufficient_data';
                continue;
            }

            $average = $bucket['average_reservations'];

            if ($maximumAverage <= 0 || $average === null) {
                $bucket['demand_level'] = 'no_observed_demand';
                continue;
            }

            $ratio = $average / $maximumAverage;

            $bucket['demand_level'] = match (true) {
                $ratio >= 0.80 => 'busy',
                $ratio >= 0.45 => 'moderate',
                default => 'relatively_quiet',
            };
        }

        unset($bucket);

        $highestDemand = collect($bucketResults)
            ->filter(fn ($bucket) =>
                $bucket['demand_level'] === 'busy'
            )
            ->values();

        $quietPeriods = collect($bucketResults)
            ->filter(fn ($bucket) =>
                $bucket['demand_level'] === 'relatively_quiet'
            )
            ->values();

        return [
            'requested_date' => $targetDate->toDateString(),

            'day_name' => $targetDate
                ->locale('id')
                ->dayName,

            'operating_hours' => [
                'start' => config(
                    'room.operating_hours.start',
                    '07:30'
                ),
                'end' => config(
                    'room.operating_hours.end',
                    '19:00'
                ),
            ],

            'method' => 'historical_same_weekday_time_bucket_analysis',

            'data_source' => $dataSource,

            'data_basis' => 'approved_reservations',

            'history_weeks_requested' => $historyWeeks,

            'observed_weeks' => $sampleCount,

            'minimum_history_weeks' => $minimumWeeks,

            'history_available' => $historyAvailable,

            'history_dates' => $observedDates,

            'message' => $historyAvailable
                ? 'Analisis kecenderungan permintaan berhasil dibuat.'
                : 'Data historis belum cukup untuk menganalisis kecenderungan permintaan.',

            'buckets' => $bucketResults,

            'busy_periods' => $highestDemand
                ->values()
                ->all(),

            'relatively_quiet_periods' => $quietPeriods
                ->values()
                ->all(),
        ];
    }

    
/**
 * Generate room demand heatmap by weekday and time interval.
 *
 * @param int $weeks Historical period: 4, 8, or 12 weeks.
 */
public function heatmap(int $weeks = 8): array
{
    if (!in_array($weeks, [4, 8, 12], true)) {
        throw new \InvalidArgumentException(
            'Periode heatmap harus 4, 8, atau 12 minggu.'
        );
    }

    $timezone = 'Asia/Makassar';

    $today = CarbonImmutable::now($timezone)->startOfDay();
    $endDate = $today->subDay();

    // Use the last N complete calendar days, ending yesterday.
    $requestedStartDate = $endDate->subDays(($weeks * 7) - 1);

    $minimumWeeks = max(
        1,
        (int) config('room.assistant.minimum_history_weeks', 3)
    );

    $bucketMinutes = (int) config(
        'room.assistant.trend_bucket_minutes',
        120
    );

    $openingMinutes = $this->timeToMinutes(
        config('room.operating_hours.start', '07:30')
    );

    $closingMinutes = $this->timeToMinutes(
        config('room.operating_hours.end', '19:00')
    );

    if (
        $bucketMinutes < 1 ||
        $openingMinutes >= $closingMinutes
    ) {
        throw new \RuntimeException(
            'Room demand analytics configuration is invalid.'
        );
    }

    // Determine the beginning of valid data coverage.
    $configuredStartDate = config('room.analytics.data_start_date');

    if ($configuredStartDate) {
        $coverageStartDate = CarbonImmutable::parse(
            $configuredStartDate,
            $timezone
        )->startOfDay();

        $coverageStartSource = 'configured';
    } else {
        // Fallback: estimate coverage from the oldest stored reservation.
        $earliestReservationDate = Reservation::query()
            ->whereDate('reservation_date', '<=', $endDate->toDateString())
            ->min('reservation_date');

        $coverageStartDate = $earliestReservationDate
            ? CarbonImmutable::parse(
                $earliestReservationDate,
                $timezone
            )->startOfDay()
            : null;

        $coverageStartSource = $coverageStartDate
            ? 'earliest_reservation'
            : 'unknown';
    }

    $observationStartDate = $requestedStartDate;

    if (
        $coverageStartDate &&
        $coverageStartDate->greaterThan($observationStartDate)
    ) {
        $observationStartDate = $coverageStartDate;
    }

    // Prepare all weekdays, Monday through Sunday.
    $weekdayNames = [
        1 => 'Senin',
        2 => 'Selasa',
        3 => 'Rabu',
        4 => 'Kamis',
        5 => 'Jumat',
        6 => 'Sabtu',
        7 => 'Minggu',
    ];

    $datesByWeekday = [];

    foreach (range(1, 7) as $weekday) {
        $datesByWeekday[$weekday] = [];
    }

    // Include every covered calendar date, even when it has zero reservations.
    if (
        $coverageStartDate &&
        !$observationStartDate->greaterThan($endDate)
    ) {
        for (
            $date = $observationStartDate;
            !$date->greaterThan($endDate);
            $date = $date->addDay()
        ) {
            $weekday = $date->dayOfWeekIso;

            $datesByWeekday[$weekday][] = $date->toDateString();
        }
    }

    // Retrieve approved reservations within the observation period.
    $reservations = collect();

    if (
        $coverageStartDate &&
        !$observationStartDate->greaterThan($endDate)
    ) {
        $reservations = Reservation::query()
            ->where('status', 'approved')
            ->whereBetween('reservation_date', [
                $observationStartDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->get([
                'reservation_code',
                'reservation_date',
                'start_time',
                'end_time',
            ]);
    }

    // Group reservations by date.
    $reservationsByDate = $reservations->groupBy(
        fn ($reservation) => CarbonImmutable::parse(
            $reservation->reservation_date,
            $timezone
        )->toDateString()
    );

    // Build operational time intervals.
    $buckets = [];

    for (
        $start = $openingMinutes;
        $start < $closingMinutes;
        $start += $bucketMinutes
    ) {
        $buckets[] = [
            'start' => $start,
            'end' => min(
                $start + $bucketMinutes,
                $closingMinutes
            ),
        ];
    }

    $days = [];

    foreach ($weekdayNames as $weekdayNumber => $weekdayName) {
        $sampleDates = $datesByWeekday[$weekdayNumber];

        $observedDays = count($sampleDates);

        $historyAvailable = $observedDays >= $minimumWeeks;

        $bucketResults = [];

        foreach ($buckets as $bucket) {
            $totalReservations = 0;

            // Every observed date is evaluated.
            // Dates without approved reservations contribute zero.
            foreach ($sampleDates as $sampleDate) {
                $dateReservations = $reservationsByDate->get(
                    $sampleDate,
                    collect()
                );

                $count = $dateReservations
                    ->filter(function ($reservation) use ($bucket) {
                        $reservationStart = $this->timeToMinutes(
                            $reservation->start_time
                        );

                        $reservationEnd = $this->timeToMinutes(
                            $reservation->end_time
                        );

                        return $reservationStart < $bucket['end']
                            && $reservationEnd > $bucket['start'];
                    })
                    ->count();

                $totalReservations += $count;
            }

            $average = $historyAvailable
                ? round($totalReservations / $observedDays, 2)
                : null;

            $bucketResults[] = [
                'start_time' => $this->minutesToTime(
                    $bucket['start']
                ),
                'end_time' => $this->minutesToTime(
                    $bucket['end']
                ),
                'total_reservations' => $totalReservations,
                'average_reservations' => $average,
                'observed_days' => $observedDays,
                'demand_level' => 'insufficient_data',
            ];
        }

        // Classify demand relative to other time intervals
        // on the same weekday.
        $validAverages = collect($bucketResults)
            ->pluck('average_reservations')
            ->filter(fn ($value) => $value !== null)
            ->values();

        $maximumAverage = $validAverages->max() ?? 0;

        foreach ($bucketResults as &$bucket) {
            if (!$historyAvailable) {
                $bucket['demand_level'] = 'insufficient_data';
                continue;
            }

            $average = $bucket['average_reservations'];

            if ($maximumAverage <= 0 || $average === null) {
                $bucket['demand_level'] = 'no_observed_demand';
                continue;
            }

            $ratio = $average / $maximumAverage;

            $bucket['demand_level'] = match (true) {
                $ratio >= 0.80 => 'busy',
                $ratio >= 0.45 => 'moderate',
                default => 'relatively_quiet',
            };
        }

        unset($bucket);

        $days[] = [
            'weekday' => $weekdayName,
            'weekday_number' => $weekdayNumber,
            'observed_days' => $observedDays,
            'history_available' => $historyAvailable,
            'buckets' => $bucketResults,
        ];
    }

    // Detect the source of the approved reservation data.
    $demoCount = $reservations
        ->filter(fn ($reservation) =>
            str_starts_with(
                (string) $reservation->reservation_code,
                'DEMO-ANALYTICS-'
            )
        )
        ->count();

    $dataSource = match (true) {
        $reservations->isEmpty() => 'no_data',
        $demoCount === $reservations->count() => 'demo',
        $demoCount > 0 => 'mixed',
        default => 'operational',
    };

    $historyAvailable = collect($days)->every(
        fn ($day) => $day['history_available']
    );

    $observedDaysTotal = array_sum(
        array_map(
            fn ($day) => $day['observed_days'],
            $days
        )
    );

    return [
        'method' => 'weekday_time_bucket_heatmap',

        'data_source' => $dataSource,

        'data_basis' => 'approved_reservations',

        'history_weeks_requested' => $weeks,

        'minimum_history_weeks' => $minimumWeeks,

        'history_available' => $historyAvailable,

        'coverage_start_date' => $coverageStartDate?->toDateString(),

        'coverage_start_source' => $coverageStartSource,

        'observation_period' => [
            'start_date' => $observedDaysTotal > 0
                ? $observationStartDate->toDateString()
                : null,
            'end_date' => $observedDaysTotal > 0
                ? $endDate->toDateString()
                : null,
        ],

        'observed_days_total' => $observedDaysTotal,

        'operating_hours' => [
            'start' => config(
                'room.operating_hours.start',
                '07:30'
            ),
            'end' => config(
                'room.operating_hours.end',
                '19:00'
            ),
        ],

        'demand_level_basis' =>
            'Relative comparison between time intervals within the same weekday.',

        'message' => $historyAvailable
            ? 'Heatmap permintaan ruangan berhasil dibuat.'
            : 'Data historis belum mencukupi untuk seluruh hari. Periksa jumlah hari pengamatan setiap hari.',

        'coverage_note' => $coverageStartSource === 'earliest_reservation'
            ? 'Tanggal awal pengamatan diperkirakan dari reservasi tertua. Tetapkan ROOM_ANALYTICS_START_DATE sesuai tanggal awal pencatatan sebenarnya untuk hasil yang lebih akurat.'
            : (
                $coverageStartSource === 'configured'
                    ? 'Tanggal awal pengamatan menggunakan konfigurasi ROOM_ANALYTICS_START_DATE.'
                    : 'Belum tersedia tanggal awal cakupan data.'
            ),

        'days' => $days,
    ];
}

    /**
     * Convert HH:MM or HH:MM:SS into minutes.
     */
    private function timeToMinutes(string $time): int
    {
        $parts = array_map('intval', explode(':', $time));

        return ($parts[0] * 60) + ($parts[1] ?? 0);
    }

    /**
     * Convert minutes into HH:MM format.
     */
    private function minutesToTime(int $minutes): string
    {
        return sprintf(
            '%02d:%02d',
            intdiv($minutes, 60),
            $minutes % 60
        );
    }
}
