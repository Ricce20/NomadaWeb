<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Ownership\SucursalController;
use App\Http\Controllers\Ownership\EmpleadoController;
use App\Http\Controllers\Ownership\UserController;
use App\Http\Controllers\Ownership\AlmacenController;
use App\Http\Controllers\Ownership\BranchProductController;
use App\Http\Controllers\ownership\VehiculoController;
use App\Http\Controllers\ownership\NegocioClienteController;


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
            
            // Dashboard de inventario por almacén (solo lectura)
            Route::get('inventario', [\App\Http\Controllers\Ownership\WarehouseDashboardController::class, 'index'])->name('inventario.index');
            Route::get('inventario/{warehouse}', [\App\Http\Controllers\Ownership\WarehouseDashboardController::class, 'show'])->name('inventario.show');
        });

});