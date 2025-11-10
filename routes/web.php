<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;


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
    }); 

require __DIR__.'/settings.php';
require __DIR__. '/sucursales.php';
require __DIR__.'/auth.php';
