<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ownership\SucursalController;
use App\Http\Controllers\ownership\EmpleadoController;


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
    });
});