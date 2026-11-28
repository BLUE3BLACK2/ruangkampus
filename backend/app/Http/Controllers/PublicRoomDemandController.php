<?php

namespace App\Http\Controllers;

use App\Services\RoomDemandAnalyticsService;
use Illuminate\Http\JsonResponse;

class PublicRoomDemandController extends Controller
{
    public function __construct(
        private RoomDemandAnalyticsService $demandAnalyticsService
    ) {}

    public function index(): JsonResponse
    {
        $heatmap = $this->demandAnalyticsService->heatmap(8);

        $summary = [
            'busy' => 0,
            'moderate' => 0,
            'relatively_quiet' => 0,
        ];

        foreach ($heatmap['days'] as $day) {
            foreach ($day['buckets'] as $bucket) {
                if (isset($summary[$bucket['demand_level']])) {
                    $summary[$bucket['demand_level']]++;
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'data_source' => $heatmap['data_source'],
                'history_available' => $heatmap['history_available'],
                'observation_period' => $heatmap['observation_period'],
                'operating_hours' => $heatmap['operating_hours'],
                'summary' => $summary,
                'message' => $heatmap['message'],
                'coverage_note' => $heatmap['coverage_note'],
            ],
        ]);
    }
}