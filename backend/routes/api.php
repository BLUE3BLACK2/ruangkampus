
<?php

use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API RuangKuliah berhasil terhubung!',
        'application' => 'RuangKuliah'
    ]);
});
