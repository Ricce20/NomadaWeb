<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Ownership\SucursalController;
use App\Http\Controllers\Ownership\EmpleadoController;
use App\Http\Controllers\Ownership\UserController;
use App\Http\Controllers\Ownership\AlmacenController;
use App\Http\Controllers\Ownership\BranchProductController;
use App\Http\Controllers\Ownership\VehiculoController;
use App\Http\Controllers\Ownership\NegocioClienteController;
use App\Http\Controllers\Api\ApiNegocioController;
use App\Http\Controllers\empleados\PedidosController;
use App\Http\Controllers\Ownership\InventoryMovementController;
Route::middleware('auth')->group(function () {
    Route::prefix('sucursales')->name('sucursales.')->group(function () {
        //sucursales
        Route::get('/index', [SucursalController::class, 'index'])->name('index');
        Route::get('/{id}/view',[SucursalController::class,'view'])->name('view');
        Route::get('/create', [SucursalController::class, 'create'])->name('create');
        Route::post('/store', [SucursalController::class, 'store'])->name('store');
        Route::get('/{id}/edit',[SucursalController::class,'edit'])->name('edit');
        Route::put('/{id}/update',[SucursalController::class,'update'])->name('update');

    });

    Route::prefix('sucursal')->name('sucursal.')->group(function(){
        //empleados
        Route::get('/empleados/{sucursalId}/index',[EmpleadoController::class, 'index'])->name('empleado.index');
        Route::get('/empleados/registrar',[EmpleadoController::class,'create'])
        ->name('empleado.create');
        Route::get('/empleados/{id}/edit',[EmpleadoController::class, 'edit'])
        ->name('empleado.edit');
        Route::post('/empleado/create',[EmpleadoController::class,'store'])
        ->name('empleado.store');
        Route::put('/empleado/{id}/update',[EmpleadoController::class,'update'])
        ->name('empleado.update');
        Route::delete('/empleado/{id}/delete',[EmpleadoController::class,'delete'])
        ->name('empleado.delete');
        //usuarios
        Route::get('/{sucursalId}/usuarios/index', [UserController::class, 'index'])->name('usuario.index');
        Route::post('/registrar/usuario', [UserController::class, 'store'])->name('usuario.store');
        Route::put('/{usuario}/usuario/update', [UserController::class, 'update'])->name('usuario.update');
        Route::delete('/{usuario}/usuario/delete', [UserController::class, 'destroy'])->name('usuario.delete');
        Route::put('/{usuario}/usuario/restore', [UserController::class, 'restore'])->name('usuario.restore');
        //almacenes
        Route::get('/{sucursalId}/almacenes/index',[AlmacenController::class,'index'])->name('almacen.index');
        Route::post('/registrar/almacen',[AlmacenController::class,'store'])->name('almacen.store');
        Route::put('/{id}/almacen/update',[AlmacenController::class,'update'])->name('almacen.update');
        Route::delete('/{id}/almacen/delete',[AlmacenController::class,'delete'])->name('almacen.delete');
        Route::get('/{sucursalId}/almacen/{almacenId}',[AlmacenController::class,'verInventario'])->name('almacen.inventario');
        Route::get('/gestion/almacenes',[AlmacenController::class,'obtenerAlmacenesPorSucursal'])->name('almacen.gestion');
        Route::get('/almacen/{id}/inventario',[AlmacenController::class,'verInventarioParaEmpleado'])->name('almacen.inventario-empleado');
        Route::get('/inventario/movimientos',[InventoryMovementController::class,'indexParaEmpleado'])->name('inventario.ver-movimientos-inventario');
        Route::get('/inventario/generar-movimiento',[InventoryMovementController::class,'createParaEmpleado'])->name('inventario.crear-movimiento-inventario-empleado');
        Route::post('/inventario/generar-registro', [InventoryMovementController::class, 'store'])->name('inventario.generar.store');
        Route::get('/inventario/movimiento/{id}/detalles',[InventoryMovementController::class,'show'])->name('inventario.ver-movimiento-empleado');
        Route::post('/inventario/movimiento/{id}/completar',[InventoryMovementController::class,'completeMovement'])->name('inventario.completar-movimiento-empleado');
        Route::post('/inventario/movimiento/{id}/cancelar',[InventoryMovementController::class,'cancelMovement'])->name('inventario.cancelar-movimiento-empleado');
        Route::post('/cliente/generar-pedido',[PedidosController::class,'store'])->name('pedido.generar');
        //vehiculos
        Route::get('{sucurslId}/vehiculos/index',[VehiculoController::class,'index'])->name('vehiculo.index');
        Route::post('/registrar/hehiculo',[VehiculoController::class,'store'])->name('vehiculo.store');
        Route::put('/{id}/vehiculo/update',[VehiculoController::class,'update'])->name('vehiculo.update');
        Route::delete('/{id}/vehiculo/delete',[VehiculoController::class,'delete'])->name('vehiculo.delete');

        //clientes-owner
        Route::get('/clientes/index',[NegocioClienteController::class,'index'])->name('cliente.index');
        Route::post('/clientes/store',[NegocioClienteController::class,'store'])->name('cliente.store');
        Route::put('/clientes/{id}/update',[NegocioClienteController::class,'update'])->name('cliente.update');
        Route::delete('/clientes/{id}/delete',[NegocioClienteController::class,'delete'])->name('cliente.delete');
        
        // Alias de compatibilidad: /sucursal/{sucursal}/productos → /sucursales/{sucursal}/productos
        Route::get('/{sucursal}/productos', function (\App\Models\Sucursal $sucursal) {
            return redirect()->route('sucursales.productos.index', $sucursal);
        })->name('productos.redirect');

        Route::get('/clientes-negocio/index',[NegocioClienteController::class,'clientes'])->name('cliente.negocio.index');
        Route::get('/pedidos/buscar-productos', [ApiNegocioController::class, 'searchProducts'])
        ->name('orders.search-products');

        //pedidos
        Route::get('/cliente/{id}/generar-pedido',[PedidosController::class,'crearPedidoLocal'])->name('pedido.crear-local');
        Route::get('/pedidos/index',[PedidosController::class,'index'])->name('pedido.panel');
        Route::get('/pedidos/{pedido}',[PedidosController::class,'show'])->name('pedido.show');
        Route::post('/pedidos/{pedido}/asignar-vehiculo',[PedidosController::class,'asignarVehiculo'])->name('pedido.asignar-vehiculo');
        Route::post('/pedidos/{pedido}/completar',[PedidosController::class,'completarPedido'])->name('pedido.completar');
        Route::post('/pedidos/{pedido}/cancelar',[PedidosController::class,'cancelarPedido'])->name('pedido.cancelar');
        Route::get('/pedidos/ver/historial',[PedidosController::class,'historial'])->name('pedido.historial');
        Route::put('/pedidos/edit/{pedido}/actualizar-asignacion',[PedidosController::class,'actualizarAsignacion'])->name('pedido.actualizar-asignacion');
        Route::put('/pedidos/{id}/confirmar',[PedidosController::class,'confirmarPedido'])->name('pedido.confirmar');
    });

    // Productos por sucursal (Route Model Binding)
    Route::middleware(['auth'])
        ->prefix('sucursales/{sucursal}')
        ->name('sucursales.')
        ->group(function () {
            Route::get('productos', [BranchProductController::class, 'index'])->name('productos.index');
            Route::get('productos/catalogo', [BranchProductController::class, 'catalog'])->name('productos.catalogo');
            Route::post('productos', [BranchProductController::class, 'store'])->name('productos.store');
            Route::post('productos/quick-add', [BranchProductController::class, 'quickAdd'])->name('productos.quick-add');
            Route::post('productos/from-catalog', [BranchProductController::class, 'fromCatalog'])->name('productos.from-catalog');
            Route::put('productos/{pivot}', [BranchProductController::class, 'update'])->name('productos.update');
            Route::post('productos/{pivot}/image', [BranchProductController::class, 'updateImage'])->name('productos.update-image');
            Route::delete('productos/{pivot}/image', [BranchProductController::class, 'destroyImage'])->name('productos.destroy-image');
            Route::delete('productos/{pivot}', [BranchProductController::class, 'destroy'])->name('productos.destroy');
            
            // Dashboard de inventario por almacén (solo lectura) - Accesible para owner y warehouse_man
            Route::middleware(['role:owner,warehouse_man'])->group(function () {
                // Route::get('inventario', [\App\Http\Controllers\Ownership\WarehouseDashboardController::class, 'index'])->name('inventario.index');
                // Route::get('inventario/{warehouse}', [\App\Http\Controllers\Ownership\WarehouseDashboardController::class, 'show'])->name('inventario.show');
                // Movimientos de inventario (entradas y ajustes)
                Route::get('movimientos-inventario', [\App\Http\Controllers\Ownership\InventoryMovementController::class, 'index'])->name('movimientos-inventario.index');
                Route::get('movimientos-inventario/create', [\App\Http\Controllers\Ownership\InventoryMovementController::class, 'create'])->name('movimientos-inventario.create');
                
            });
            
        });

});