<?php

namespace App\Services;

use App\Models\Reservation;

class RoomUsagePredictionService
{
    /**
     * Minimum historical observations required
     * before producing a prediction.
     */
    private const MIN_HISTORY_SAMPLES = 3;

    /**
     * Number of previous matching weekdays to analyze.
     */
    private const HISTORY_WEEKS = 4;

    /**
     * Predict approved reservation demand for the next seven days.
     */
    public function predictNextSevenDays(): array
    {
        $today = now()->startOfDay()->toImmutable();
        $yesterday = $today->subDay();

        $firstForecastDate = $today->addDay();

        // Earliest historical date needed for the first forecast.
        $historyStart = $firstForecastDate->subWeeks(
            self::HISTORY_WEEKS
        );

        // Retrieve historical approved reservations.
        $dailyCounts = Reservation::query()
            ->where('status', 'approved')
            ->whereBetween('reservation_date', [
                $historyStart->toDateString(),
                $yesterday->toDateString(),
            ])
            ->selectRaw(
                'DATE(reservation_date) as reservation_day,
                 COUNT(*) as reservations_count'
            )
            ->groupBy('reservation_day')
            ->orderBy('reservation_day')
            ->get()
            ->mapWithKeys(fn ($row) => [
                $row->reservation_day => (int) $row->reservations_count,
            ]);

        /*
         * Do not generate predictions when no historical
         * approved reservations are available.
         */
        if ($dailyCounts->isEmpty()) {
            $predictions = [];

            for ($offset = 1; $offset <= 7; $offset++) {
                $forecastDate = $today->addDays($offset);

                $predictions[] = [
                    'date' => $forecastDate->toDateString(),
                    'day_name' => $forecastDate->locale('id')->dayName,
                    'predicted_reservations' => null,
                    'historical_average' => null,
                    'history_sample_count' => 0,
                    'history_samples' => [],
                    'status' => 'insufficient_data',
                    'reason' => 'no_approved_reservations',
                ];
            }

            return [
                'generated_at' => now()->toIso8601String(),
                'forecast_period' => [
                    'start_date' => $firstForecastDate->toDateString(),
                    'end_date' => $today->addDays(7)->toDateString(),
                ],
                'method' => 'same_weekday_moving_average',
                'history_weeks' => self::HISTORY_WEEKS,
                'minimum_history_samples' => self::MIN_HISTORY_SAMPLES,
                'data_basis' => 'approved_reservations',
                'history_available' => false,
                'message' => 'Belum ada reservasi approved dalam periode historis. Prediksi belum dapat dihitung.',
                'predictions' => $predictions,
            ];
        }

        $predictions = [];

        // Generate predictions for the next seven calendar days.
        for ($offset = 1; $offset <= 7; $offset++) {
            $forecastDate = $today->addDays($offset);

            $historicalSamples = [];

            // Compare the same weekday from previous weeks.
            for ($week = 1; $week <= self::HISTORY_WEEKS; $week++) {
                $historicalDate = $forecastDate->subWeeks($week);

                // Never use today's potentially incomplete data.
                if (!$historicalDate->lessThan($today)) {
                    continue;
                }

                $dateKey = $historicalDate->toDateString();

                $historicalSamples[] = [
                    'date' => $dateKey,
                    'reservations' => $dailyCounts->get($dateKey, 0),
                ];
            }

            $sampleCount = count($historicalSamples);

            $totalReservations = collect($historicalSamples)
                ->sum('reservations');

            $average = $sampleCount > 0
                ? $totalReservations / $sampleCount
                : null;

            $hasEnoughData = $sampleCount >= self::MIN_HISTORY_SAMPLES;

            $predictions[] = [
                'date' => $forecastDate->toDateString(),
                'day_name' => $forecastDate->locale('id')->dayName,
                'predicted_reservations' => $hasEnoughData
                    ? (int) round($average)
                    : null,
                'historical_average' => $hasEnoughData
                    ? round($average, 2)
                    : null,
                'history_sample_count' => $sampleCount,
                'history_samples' => $historicalSamples,
                'status' => $hasEnoughData
                    ? 'sufficient'
                    : 'insufficient_data',
            ];
        }

        return [
            'generated_at' => now()->toIso8601String(),
            'forecast_period' => [
                'start_date' => $firstForecastDate->toDateString(),
                'end_date' => $today->addDays(7)->toDateString(),
            ],
            'method' => 'same_weekday_moving_average',
            'history_weeks' => self::HISTORY_WEEKS,
            'minimum_history_samples' => self::MIN_HISTORY_SAMPLES,
            'data_basis' => 'approved_reservations',
            'history_available' => true,
            'predictions' => $predictions,
        ];
    }
}
