<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ownership\SucursalController;
use App\Http\Controllers\ownership\EmpleadoController;
use App\Http\Controllers\ownership\UserController;
use App\Http\Controllers\ownership\AlmacenController;
use App\Http\Controllers\ownership\VehiculoController;


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
    
    });


});