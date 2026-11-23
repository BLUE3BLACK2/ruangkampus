<?php

namespace App\Http\Controllers;

use App\Services\RoomRecommendationService;
use App\Services\RoomBookingAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomAssistantController extends Controller
{
    public function __construct(
    private RoomRecommendationService $recommendationService,
    private RoomBookingAssistantService $bookingAssistantService
        ) {
    }

    /**
 * Understand natural-language room booking requests.
 */
public function ask(Request $request): JsonResponse
{
    abort_unless(
        in_array(
            $request->user()?->role,
            ['mahasiswa', 'dosen'],
            true
        ),
        403,
        'Fitur ini hanya tersedia untuk mahasiswa dan dosen.'
    );

    $validated = $request->validate([
        'message' => ['required', 'string', 'max:1500'],
    ]);

    try {
        $result = $this->bookingAssistantService->ask(
            $validated['message']
        );

        $httpStatus = match ($result['status']) {
            'invalid_request' => 422,
            default => 200,
        };

        return response()->json([
            'success' => true,
            'data' => $result,
        ], $httpStatus);

    } catch (\RuntimeException $exception) {
        \Illuminate\Support\Facades\Log::warning(
            'Room booking AI assistant unavailable.',
            ['exception_type' => get_class($exception)]
        );

        return response()->json([
            'success' => false,
            'message' => 'Asisten AI sementara tidak tersedia. Silakan coba lagi.',
        ], 503);
    }
}

    /**
     * Recommend rooms based on user requirements.
     * Only mahasiswa and dosen can use this feature.
     */
    public function recommendations(Request $request): JsonResponse
    {
        // Restrict the feature to students and lecturers.
        abort_unless(
            in_array(
                $request->user()?->role,
                ['mahasiswa', 'dosen'],
                true
            ),
            403,
            'Fitur rekomendasi ruangan hanya tersedia untuk mahasiswa dan dosen.'
        );

        // Validate the user's booking requirements.
        $validated = $request->validate([
            'reservation_date' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:today',
            ],
            'start_time' => [
                'required',
                'date_format:H:i',
            ],
            'end_time' => [
                'required',
                'date_format:H:i',
                'after:start_time',
            ],
            'participant_count' => [
                'required',
                'integer',
                'between:1,1000',
            ],
            'facilities' => [
                'sometimes',
                'array',
                'max:50',
            ],
            'facilities.*' => [
                'integer',
                'distinct',
                'exists:facilities,id',
            ],
        ]);

        $result = $this->recommendationService->recommend(
            $validated
        );

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }
}
