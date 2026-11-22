
<?php

use App\Http\Controllers\FacilityController;
use App\Http\Controllers\RoomController;
use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API RuangKuliah berhasil terhubung!',
        'application' => 'RuangKuliah'
    ]);
});

// Public room routes
Route::get('/rooms', [RoomController::class, 'index']);
Route::get('/rooms/{room}', [RoomController::class, 'show']);

// Public facility routes
Route::get('/facilities', [FacilityController::class, 'index']);

// Admin routes
Route::middleware(['auth:sanctum', 'admin'])->group(function () {

    // Room management
    Route::get('/admin/rooms', [RoomController::class, 'adminIndex']);
    Route::post('/rooms', [RoomController::class, 'store']);
    Route::put('/rooms/{room}', [RoomController::class, 'update']);
    Route::patch('/rooms/{room}', [RoomController::class, 'update']);
    Route::delete('/rooms/{room}', [RoomController::class, 'destroy']);

    // Facility management
    Route::get('/facilities/{facility}', [FacilityController::class, 'show']);
    Route::post('/facilities', [FacilityController::class, 'store']);
    Route::put('/facilities/{facility}', [FacilityController::class, 'update']);
    Route::patch('/facilities/{facility}', [FacilityController::class, 'update']);
    Route::delete('/facilities/{facility}', [FacilityController::class, 'destroy']);
    Route::put('/facilities/{facility}/rooms', [FacilityController::class, 'syncRooms']);
});
