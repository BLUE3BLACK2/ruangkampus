<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\RoomDemandAnalyticsService;
use App\Services\RoomUsageAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomAnalyticsController extends Controller
{
    public function __construct(
        private RoomUsageAnalyticsService $analyticsService,
        private RoomDemandAnalyticsService $demandAnalyticsService
    ) {
    }

    /**
     * Get historical room usage statistics.
     */
    public function overview(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->analyticsService->overview(),
        ]);
    }

    /**
     * Get room reservation predictions for the next seven days.
     */
    public function predictions(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->analyticsService->predictions(),
        ]);
    }

    /**
     * Generate AI insights using DeepSeek.
     */
    public function generateInsights(): JsonResponse
    {
        $result = $this->analyticsService->generateInsights();

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Get room demand heatmap by weekday and time period.
     */
    public function heatmap(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'weeks' => ['sometimes', 'integer', 'in:4,8,12'],
        ]);

        $weeks = (int) ($validated['weeks'] ?? 8);

        $result = $this->demandAnalyticsService->heatmap($weeks);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }
}