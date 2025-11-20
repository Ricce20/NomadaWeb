<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use App\Models\Branch;
use App\Models\Warehouse;
use App\Models\WarehouseProduct;
use App\Models\InventoryMovement;
use App\Services\InventoryService;

class TestWarehouseInfrastructure extends Command
{
    protected $signature = 'warehouse:test-infrastructure';
    protected $description = 'Verifica que la infraestructura de almacenes esté correctamente instalada';

    public function handle()
    {
        $this->info('=== VERIFICACIÓN DE INFRAESTRUCTURA DE ALMACENES ===');
        $this->newLine();

        // 1. Verificar tablas
        $this->info('1. Verificando tablas...');
        $tables = ['warehouses', 'warehouse_products', 'inventory_movements'];
        foreach ($tables as $table) {
            $exists = Schema::hasTable($table);
            $this->line("   - Tabla '{$table}': " . ($exists ? '✓ Existe' : '✗ No existe'));
        }

        // 2. Verificar relaciones de Branch
        $this->newLine();
        $this->info('2. Verificando relaciones de Branch...');
        $branch = Branch::first();
        if ($branch) {
            $this->line("   - Branch encontrado: {$branch->name}");
            $this->line('   - Relación warehouses(): ' . (method_exists($branch, 'warehouses') ? '✓ Existe' : '✗ No existe'));
            $warehouses = $branch->warehouses;
            $this->line('   - Almacenes en esta sucursal: ' . $warehouses->count());
        } else {
            $this->line('   - No hay sucursales en la BD');
        }

        // 3. Verificar servicio
        $this->newLine();
        $this->info('3. Verificando InventoryService...');
        $serviceExists = class_exists(InventoryService::class);
        $this->line('   - Clase InventoryService: ' . ($serviceExists ? '✓ Existe' : '✗ No existe'));
        
        if ($serviceExists) {
            $service = new InventoryService();
            $this->line('   - Método registerMovement(): ' . (method_exists($service, 'registerMovement') ? '✓ Existe' : '✗ No existe'));
            $this->line('   - Método getStock(): ' . (method_exists($service, 'getStock') ? '✓ Existe' : '✗ No existe'));
            $this->line('   - Método getMovementHistory(): ' . (method_exists($service, 'getMovementHistory') ? '✓ Existe' : '✗ No existe'));
        }

        // 4. Verificar modelos
        $this->newLine();
        $this->info('4. Verificando modelos...');
        $models = [
            Warehouse::class,
            WarehouseProduct::class,
            InventoryMovement::class
        ];
        foreach ($models as $model) {
            $exists = class_exists($model);
            $this->line('   - Modelo ' . class_basename($model) . ': ' . ($exists ? '✓ Existe' : '✗ No existe'));
        }

        $this->newLine();
        $this->info('=== VERIFICACIÓN COMPLETADA ===');
        
        return Command::SUCCESS;
    }
}
