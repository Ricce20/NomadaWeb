<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductSearchController;
use App\Http\Controllers\Auth\ApiAuthController;
use App\Http\Controllers\Api\ApiNegocioController;
use App\Http\Controllers\Api\ApiPedidosController;

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

    //PEDIDOS Y VIAJES DEL USUARIO DRIVER
    Route::get('/api/pedidos/activos/conductor/{id}',[ApiPedidosController::class,'pedidosAsignadosActivos'])->name('api.pedidos-activos-conductor');
    Route::get('/api/pedidos/historial/conductor/{id}',[ApiPedidosController::class,'historialPedidosConductor'])->name('api.pedido-historial-conductor');
    Route::get('/api/pedido-viaje/{id}/detalle',[ApiPedidosController::class,'detallesPedidoViaje'])->name('api.pedido-viaje-detalle');
});
    Route::post('/api/register',[ApiAuthController::class,'registerClient'])->name('api.auth.register-client');
    Route::post('/api/login',[ApiAuthController::class,'login'])->name('api.auth.login');
   
