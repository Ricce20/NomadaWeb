<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductSearchController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/product-bases/search', [ProductSearchController::class, 'search']);
});
