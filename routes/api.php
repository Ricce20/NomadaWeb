<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductSearchController;
use App\Http\Controllers\Auth\ApiAuthController;
use App\Http\Controllers\Api\ApiNegocioController;
use App\Http\Controllers\Api\ApiPedidosController;
use App\Http\Controllers\Api\BarcodeController;
use App\Http\Controllers\Api\ApiProfileClientController;
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::get('/product-bases/search', [ProductSearchController::class, 'search']);
    
    // Códigos de barras
    Route::get('/barcode/search', [BarcodeController::class, 'search']);
    Route::post('/barcode', [BarcodeController::class, 'store']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    })->middleware('auth:sanctum');

    Route::post('/api/logout',[ApiAuthController::class,'logout'])->name('api.auth.logout');
    Route::get('/api/validate-token',[ApiAuthController::class,'validateToken'])->name('api.auth.validar-token');
    
    Route::get('/api/negocios-with-sucursales',[ApiNegocioController::class,'getAllWithSucursales'])->name('api.negocios-sucursales.all');
    Route::get('/api/only-negocios',[ApiNegocioController::class,'getAllOnlyNegocios'])->name('api.only-negocios.all');
    Route::get('/api/sucursal/{id}/productos',[ApiNegocioController::class,'getProductsBySucursalId'])->name('api.sucursal-id-productos');
    Route::get('/api/productos/sucursales',[ApiNegocioController::class,'getRandomProducts'])->name('api.productos-sucursales-random');

    //PEDIDOS Y VIAJES DEL USUARIO DRIVER
    Route::get('/api/pedidos/activos/conductor/{id}',[ApiPedidosController::class,'pedidosAsignadosActivos'])->name('api.pedidos-activos-conductor');
    Route::get('/api/pedidos/historial/conductor/{id}',[ApiPedidosController::class,'historialPedidosConductor'])->name('api.pedido-historial-conductor');
    Route::get('/api/pedido-viaje/{id}/detalle',[ApiPedidosController::class,'detallesPedidoViaje'])->name('api.pedido-viaje-detalle');
    Route::put('/api/pedido-viaje/{id}/actualizar-estado',[ApiPedidosController::class,'actualizarEstadoViajePedido'])->name('api.pedido-viaje-actualizar-estado');
    //para el cliente user
    Route::get('/api/pedidos/{id}/show',[ApiPedidosController::class,'show'])->name('api.pedido-cliente.show');
    Route::get('/api/pedidos/cliente-user/{id}',[ApiPedidosController::class,'pedidosPorUsuario'])->name('api.pedidos-cliente-usuario');
    Route::get('/api/pedidos/activos/cliente-usuario/{id}',[ApiPedidosController::class,'pedidosActivosClienteUser'])->name('api.pedidos-activos-cliente-usuario');

    //user-cliente-profile
    // Obtener perfil del usuario autenticado
    Route::get('/api/profile', [ApiProfileClientController::class, 'getProfile'])->name('api.auth.profile');
    
    // Actualizar email
    Route::put('/api/profile/email', [ApiProfileClientController::class, 'updateEmail'])->name('api.auth.update-email');
    
    // Actualizar teléfono
    Route::put('/api/profile/phone', [ApiProfileClientController::class, 'updatePhone'])->name('api.auth.update-phone');
    
    // Cambiar contraseña
    Route::put('/api/profile/password', [ApiProfileClientController::class, 'updatePassword'])->name('api.auth.update-password');
    
    // En routes/api.php o web.php
    Route::post('/api/negocio/{negocioId}/sucursal/{sucursalId}/costo-envio', [ApiPedidosController::class, 'obtenerCostoEnvio'])->name('api.pedido.calcular-costo');

     // Crear pedido individual desde app móvil
    Route::post('/api/pedido/crear', [ApiPedidosController::class, 'crearPedidoIndividual'])->name('api.pedido.crear-individual');
    
    // Crear múltiples pedidos desde app móvil
    Route::post('/api/pedidos/crear-multiples', [ApiPedidosController::class, 'crearPedidosMultiples'])->name('api.pedido.crear-multiple');
});
    Route::post('/api/register',[ApiAuthController::class,'registerClient'])->name('api.auth.register-client');
    Route::post('/api/login',[ApiAuthController::class,'login'])->name('api.auth.login')->middleware(['throttle:api-login']); 
