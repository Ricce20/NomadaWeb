<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;

class TestInventoryMovements extends Command
{
    protected $signature = 'inventory:test-movements';
    protected $description = 'Verifica que el módulo de movimientos de inventario esté correctamente implementado';

    public function handle()
    {
        $this->info('═══════════════════════════════════════════════════════════');
        $this->info('VERIFICACIÓN: MÓDULO DE MOVIMIENTOS DE INVENTARIO');
        $this->info('═══════════════════════════════════════════════════════════');
        $this->newLine();

        // 1. Verificar rutas
        $this->info('1. Verificando rutas...');
        $routes = collect(Route::getRoutes())->filter(function ($route) {
            return str_contains($route->uri(), 'movimientos-inventario');
        });

        if ($routes->count() > 0) {
            $this->line('   ✓ Rutas encontradas:');
            foreach ($routes as $route) {
                $methods = implode('|', $route->methods());
                $this->line("     - {$methods} {$route->uri()}");
            }
        } else {
            $this->error('   ✗ No se encontraron rutas de movimientos-inventario');
        }

        // 2. Verificar controlador
        $this->newLine();
        $this->info('2. Verificando controlador...');
        $controllerExists = class_exists('App\Http\Controllers\Ownership\InventoryMovementController');
        $this->line('   - InventoryMovementController: ' . ($controllerExists ? '✓ Existe' : '✗ No existe'));

        if ($controllerExists) {
            $controller = new \App\Http\Controllers\Ownership\InventoryMovementController();
            $this->line('   - Método index(): ' . (method_exists($controller, 'index') ? '✓ Existe' : '✗ No existe'));
            $this->line('   - Método create(): ' . (method_exists($controller, 'create') ? '✓ Existe' : '✗ No existe'));
            $this->line('   - Método store(): ' . (method_exists($controller, 'store') ? '✓ Existe' : '✗ No existe'));
        }

        // 3. Verificar FormRequest
        $this->newLine();
        $this->info('3. Verificando FormRequest...');
        $requestExists = class_exists('App\Http\Requests\Ownership\StoreInventoryMovementRequest');
        $this->line('   - StoreInventoryMovementRequest: ' . ($requestExists ? '✓ Existe' : '✗ No existe'));

        // 4. Verificar páginas React
        $this->newLine();
        $this->info('4. Verificando páginas React...');
        $indexPage = file_exists(resource_path('js/Pages/sucursales/movimientos-inventario/Index.tsx'));
        $createPage = file_exists(resource_path('js/Pages/sucursales/movimientos-inventario/Create.tsx'));
        
        $this->line('   - Index.tsx: ' . ($indexPage ? '✓ Existe' : '✗ No existe'));
        $this->line('   - Create.tsx: ' . ($createPage ? '✓ Existe' : '✗ No existe'));

        // 5. Verificar componentes UI
        $this->newLine();
        $this->info('5. Verificando componentes UI...');
        $textareaExists = file_exists(resource_path('js/components/ui/textarea.tsx'));
        $radioGroupExists = file_exists(resource_path('js/components/ui/radio-group.tsx'));
        
        $this->line('   - textarea.tsx: ' . ($textareaExists ? '✓ Existe' : '✗ No existe'));
        $this->line('   - radio-group.tsx: ' . ($radioGroupExists ? '✓ Existe' : '✗ No existe'));

        // 6. Verificar InventoryService
        $this->newLine();
        $this->info('6. Verificando InventoryService...');
        $serviceExists = class_exists('App\Services\InventoryService');
        $this->line('   - InventoryService: ' . ($serviceExists ? '✓ Existe' : '✗ No existe'));

        // 7. Verificar datos
        $this->newLine();
        $this->info('7. Verificando datos en base de datos...');
        $movements = \App\Models\InventoryMovement::count();
        $warehouses = \App\Models\Warehouse::count();
        $warehouseProducts = \App\Models\WarehouseProduct::count();
        
        $this->line('   - Movimientos registrados: ' . $movements);
        $this->line('   - Almacenes: ' . $warehouses);
        $this->line('   - Productos en almacenes: ' . $warehouseProducts);

        // 8. URLs de ejemplo
        $this->newLine();
        $this->info('8. URLs de acceso:');
        $sucursal = \App\Models\Sucursal::first();
        
        if ($sucursal) {
            $this->line('   - Lista: /sucursales/' . $sucursal->id . '/movimientos-inventario');
            $this->line('   - Crear: /sucursales/' . $sucursal->id . '/movimientos-inventario/create');
        } else {
            $this->warn('   No hay sucursales en la BD');
        }

        $this->newLine();
        $this->info('═══════════════════════════════════════════════════════════');
        $this->info('VERIFICACIÓN COMPLETADA');
        $this->info('═══════════════════════════════════════════════════════════');

        return Command::SUCCESS;
    }
}
