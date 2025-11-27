<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\Ownership\SucursalController;
use App\Http\Controllers\Management\ProductBaseController;
use App\Http\Controllers\Management\ProductBaseMediaController;
use App\Http\Controllers\Management\ProductBasePricingController;

Route::get('/', function () {
    return view('landing-page');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $user = auth()->user();
        $primaryBranch = null;
        
        // Determinar sucursal principal según el rol
        if ($user && in_array($user->type, ['owner', 'warehouse_man', 'manager', 'driver'])) {
            // Para owner: primera sucursal de su negocio
            if ($user->isOwner()) {
                $negocioId = $user->negocio()->pluck('id')->first();
                if ($negocioId) {
                    $sucursal = \App\Models\Sucursal::where('negocio_id', $negocioId)->first();
                    if ($sucursal) {
                        $primaryBranch = [
                            'id' => $sucursal->id,
                            'nombre' => $sucursal->nombre,
                        ];
                    }
                }
            } else {
                // Para warehouse_man, manager, driver: primera sucursal asignada
                $sucursal = $user->sucursales()->first();
                if ($sucursal) {
                    $primaryBranch = [
                        'id' => $sucursal->id,
                        'nombre' => $sucursal->nombre,
                    ];
                }
            }
        }
        
        return Inertia::render('dashboard', [
            'primaryBranch' => $primaryBranch,
        ]);
    })->name('dashboard');

    Route::get('management', function () {
        return Inertia::render('management');
    })->name('management');

    // Grupo de rutas de management (temporalmente sin restricción de rol para pruebas)
    Route::prefix('management')
        ->name('management.')
        ->middleware(['auth', 'verified', 'role:super_admin'])
        ->group(function () {
            // CRUD de product_bases
            Route::resource('product-bases', ProductBaseController::class);

            // Media
            Route::post('product-bases/{product}/images', [ProductBaseController::class, 'imagesStore'])
                ->name('product-bases.images.store');
            Route::delete('product-bases/{product}/images/{image}', [ProductBaseController::class, 'imagesDestroy'])
                ->name('product-bases.images.destroy');

            // DEPRECATED: Pricing routes removed
            // Los precios por sucursal se administran en: /sucursales/{id}/productos

            // Soft delete management
            Route::post('product-bases/{id}/restore', [ProductBaseController::class, 'restore'])
                ->name('product-bases.restore');
            Route::delete('product-bases/{id}/force', [ProductBaseController::class, 'forceDelete'])
                ->name('product-bases.force-delete');
        });

    Route::get('ownership', function () {
        return Inertia::render('ownership');
    })->name('ownership');
    }); 

require __DIR__.'/settings.php';
require __DIR__. '/sucursales.php';
require __DIR__.'/auth.php';
require __DIR__.'/api.php';