<?php

namespace App\Services;

use App\Models\Reservation;
use Carbon\CarbonImmutable;
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
     */
    public function overview(): array
    {
        [$startDate, $endDate] = $this->historicalPeriod();

        $baseQuery = Reservation::query()
            ->where('status', 'approved')
            ->whereBetween('reservation_date', [
                $startDate,
                $endDate,
            ]);

        $totalReservations = (clone $baseQuery)->count();

        $totalParticipants = (int) (clone $baseQuery)
            ->sum('participant_count');

        $dailyRows = (clone $baseQuery)
            ->selectRaw(
                'DATE(reservation_date) as reservation_day,
                 COUNT(*) as total_reservations'
            )
            ->groupBy('reservation_day')
            ->orderBy('reservation_day')
            ->get();

        $roomRows = Reservation::query()
            ->with('room:id,room_code,room_name')
            ->where('status', 'approved')
            ->whereBetween('reservation_date', [
                $startDate,
                $endDate,
            ])
            ->selectRaw(
                'room_id, COUNT(*) as total_reservations'
            )
            ->groupBy('room_id')
            ->orderByDesc('total_reservations')
            ->limit(5)
            ->get();

        $busiestDay = $dailyRows
            ->sortByDesc('total_reservations')
            ->first();

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

            'total_approved_reservations' => $totalReservations,

            'total_participants' => $totalParticipants,

            'busiest_day' => $busiestDay ? [
                'date' => $busiestDay->reservation_day,
                'day_name' => CarbonImmutable::parse(
                    $busiestDay->reservation_day
                )->locale('id')->dayName,
                'total_reservations' => (int) $busiestDay->total_reservations,
            ] : null,

            'daily_reservations' => $dailyRows
                ->map(fn ($row) => [
                    'date' => $row->reservation_day,
                    'total_reservations' => (int) $row->total_reservations,
                ])
                ->values()
                ->all(),

            'most_reserved_rooms' => $roomRows
                ->map(fn ($row) => [
                    'room_id' => $row->room_id,
                    'room_code' => $row->room?->room_code,
                    'room_name' => $row->room?->room_name,
                    'total_reservations' => (int) $row->total_reservations,
                ])
                ->values()
                ->all(),
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

        // Do not consume AI tokens when there is no historical data.
        if (!($prediction['history_available'] ?? false)) {
            return [
                'status' => 'insufficient_data',
                'message' => 'Belum tersedia data historis untuk menghasilkan AI Insights.',
                'prediction' => $prediction,
                'insight' => null,
            ];
        }

        $overview = $this->overview();

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
                    'model' => $aiResult['model'],
                    'content' => $aiResult['content'],
                    'usage' => $aiResult['usage'],
                ],
            ];
        } catch (Throwable $exception) {
            // Avoid logging API keys or sensitive request details.
            Log::warning('Room analytics AI insight generation failed.', [
                'exception_type' => get_class($exception),
            ]);

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
            ->where('reservation_code', 'like', 'DEMO-ANALYTICS-%')
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
