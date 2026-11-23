<?php

return [
    'operating_hours' => [
        'start' => env('ROOM_OPERATING_START', '07:30'),
        'end' => env('ROOM_OPERATING_END', '19:00'),
    ],

    'assistant' => [
        'alternative_step_minutes' => (int) env(
            'ROOM_ASSISTANT_STEP_MINUTES',
            30
        ),

        'trend_bucket_minutes' => (int) env(
            'ROOM_TREND_BUCKET_MINUTES',
            120
        ),

        'trend_history_weeks' => (int) env(
            'ROOM_TREND_HISTORY_WEEKS',
            8
        ),

        'minimum_history_weeks' => (int) env(
            'ROOM_TREND_MINIMUM_HISTORY_WEEKS',
            3
        ),
    ],
];