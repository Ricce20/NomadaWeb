<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductSearchController;
use App\Http\Controllers\Auth\ApiAuthController;
use App\Http\Controllers\Api\ApiNegocioController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/product-bases/search', [ProductSearchController::class, 'search']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    })->middleware('auth:sanctum');

    Route::post('/api/logout',[ApiAuthController::class,'logout'])->name('api.auth.logout');
    
    Route::get('/api/negocios-with-sucursales',[ApiNegocioController::class,'getAllWithSucursales'])->name('api.negocios-sucursales.all');
    Route::get('/api/only-negocios',[ApiNegocioController::class,'getAllOnlyNegocios'])->name('api.only-negocios.all');
    Route::get('/api/sucursal/{id}/productos',[ApiNegocioController::class,'getProductsBySucursalId'])->name('api.sucursal-id-productos');
    Route::get('/api/productos/sucursales',[ApiNegocioController::class,'getRandomProducts'])->name('api.productos-sucursales-random');
    
});
    Route::post('/api/register',[ApiAuthController::class,'registerClient'])->name('api.auth.register-client');
    Route::post('/api/login',[ApiAuthController::class,'login'])->name('api.auth.login');
   
