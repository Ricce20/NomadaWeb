<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

use App\Http\Controllers\ownership\SucursalController;

Route::get('/', function () {
    return view('landing-page');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('management', function () {
        return Inertia::render('management');
    })->name('management');

    Route::get('ownership', function () {
        return Inertia::render('ownership');
    })->name('ownership');
    //sucursales
    Route::get('sucursales/index', [SucursalController::class, 'index'])->name('sucursales.index');
    Route::get('sucursales/create', [SucursalController::class, 'create'])->name('sucursales.create');
    Route::post('sucursales/store', [SucursalController::class, 'store'])->name('sucursales.store');
    Route::get('sucursales/{id}/edit',[SucursalController::class,'edit'])->name('sucursales.edit');
    Route::put('sucursales/{id}/update',[SucursalController::class,'update'])->name('sucursales.update');
}); 

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
