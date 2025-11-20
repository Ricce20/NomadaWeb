<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Sucursal;
use App\Models\Warehouse;
use App\Models\WarehouseProduct;
use Illuminate\Support\Facades\Route;

class TestWarehouseDashboard extends Command
{
    protected $signature = 'warehouse:test-dashboard';
    protected $description = 'Verifica que el dashboard de inventario esté correctamente implementado';

    public function handle()
    {
        $this->info('=== VERIFICACIÓN DE DASHBOARD DE INVENTARIO ===');
        $this->newLine();

        // 1. Verificar rutas
        $this->info('1. Verificando rutas...');
        $routes = collect(Route::getRoutes())->filter(function ($route) {
            return str_contains($route->uri(), 'inventario');
        });

        if ($routes->count() > 0) {
            $this->line('   ✓ Rutas de inventario encontradas:');
            foreach ($routes as $route) {
                $this->line('     - ' . $route->methods()[0] . ' ' . $route->uri());
            }
        } else {
            $this->error('   ✗ No se encontraron rutas de inventario');
        }

        // 2. Verificar controlador
        $this->newLine();
        $this->info('2. Verificando controlador...');
        $controllerExists = class_exists('App\Http\Controllers\Ownership\WarehouseDashboardController');
        $this->line('   - WarehouseDashboardController: ' . ($controllerExists ? '✓ Existe' : '✗ No existe'));

        if ($controllerExists) {
            $controller = new \App\Http\Controllers\Ownership\WarehouseDashboardController();
            $this->line('   - Método index(): ' . (method_exists($controller, 'index') ? '✓ Existe' : '✗ No existe'));
            $this->line('   - Método show(): ' . (method_exists($controller, 'show') ? '✓ Existe' : '✗ No existe'));
        }

        // 3. Verificar datos de prueba
        $this->newLine();
        $this->info('3. Verificando datos en base de datos...');
        
        $sucursales = Sucursal::count();
        $this->line('   - Sucursales: ' . $sucursales);

        $warehouses = Warehouse::count();
        $this->line('   - Almacenes: ' . $warehouses);

        $warehouseProducts = WarehouseProduct::count();
        $this->line('   - Productos en almacenes: ' . $warehouseProducts);

        // 4. Verificar páginas React
        $this->newLine();
        $this->info('4. Verificando páginas React...');
        $dashboardPage = file_exists(resource_path('js/Pages/sucursales/almacenes/Dashboard.tsx'));
        $inventoryPage = file_exists(resource_path('js/Pages/sucursales/almacenes/Inventory.tsx'));
        
        $this->line('   - Dashboard.tsx: ' . ($dashboardPage ? '✓ Existe' : '✗ No existe'));
        $this->line('   - Inventory.tsx: ' . ($inventoryPage ? '✓ Existe' : '✗ No existe'));

        // 5. Verificar helper de sale_type
        $this->newLine();
        $this->info('5. Verificando helper de sale_type...');
        $saleTypeHelper = file_exists(resource_path('js/lib/sale-types.ts'));
        $this->line('   - sale-types.ts: ' . ($saleTypeHelper ? '✓ Existe' : '✗ No existe'));

        // 6. Ejemplo de uso
        if ($sucursales > 0 && $warehouses > 0) {
            $this->newLine();
            $this->info('6. Ejemplo de datos:');
            
            $sucursal = Sucursal::first();
            $warehouse = Warehouse::where('branch_id', $sucursal->id)->first();
            
            if ($warehouse) {
                $this->line('   - Sucursal: ' . $sucursal->nombre);
                $this->line('   - Almacén: ' . $warehouse->name);
                $this->line('   - URL Dashboard: /sucursales/' . $sucursal->id . '/inventario');
                $this->line('   - URL Inventario: /sucursales/' . $sucursal->id . '/inventario/' . $warehouse->id);
                
                $productCount = WarehouseProduct::where('warehouse_id', $warehouse->id)->count();
                $totalStock = WarehouseProduct::where('warehouse_id', $warehouse->id)->sum('stock');
                
                $this->line('   - Productos en almacén: ' . $productCount);
                $this->line('   - Stock total: ' . $totalStock);
            }
        }

        $this->newLine();
        $this->info('=== VERIFICACIÓN COMPLETADA ===');

        return Command::SUCCESS;
    }
}
