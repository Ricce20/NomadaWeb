<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductSearchController;
use App\Http\Controllers\Auth\ApiAuthController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/product-bases/search', [ProductSearchController::class, 'search']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    })->middleware('auth:sanctum');

    Route::post('/api/logout',[ApiAuthController::class,'logout'])->name('api.auth.logout')->middleware('auth:sanctum');

});
    Route::post('/api/register',[ApiAuthController::class,'registerClient'])->name('api.auth.register-client');
    Route::post('/api/login',[ApiAuthController::class,'login'])->name('api.auth.login');
