<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Sucursal;
use App\Models\Warehouse;
use App\Models\ProductBaseBranch;
use App\Services\InventoryService;
use App\Models\User;

class WarehouseDashboardSeeder extends Seeder
{
    /**
     * Seed de ejemplo para crear datos de prueba del dashboard de inventario.
     * 
     * Uso: php artisan db:seed --class=WarehouseDashboardSeeder
     */
    public function run(): void
    {
        $this->command->info('Iniciando seed del dashboard de inventario...');

        // Verificar que existan sucursales
        $sucursales = Sucursal::all();
        if ($sucursales->isEmpty()) {
            $this->command->warn('No hay sucursales en la base de datos. Crea al menos una sucursal primero.');
            return;
        }

        $service = new InventoryService();
        $user = User::first();

        foreach ($sucursales as $sucursal) {
            $this->command->info("Procesando sucursal: {$sucursal->nombre}");

            // Verificar si ya tiene almacenes
            $existingWarehouses = Warehouse::where('branch_id', $sucursal->id)->count();
            if ($existingWarehouses > 0) {
                $this->command->line("  ⚠ Esta sucursal ya tiene {$existingWarehouses} almacenes. Saltando...");
                continue;
            }

            // Crear almacén principal
            $mainWarehouse = Warehouse::create([
                'branch_id' => $sucursal->id,
                'name' => 'Almacén Principal',
                'description' => 'Almacén principal de la sucursal',
                'is_default' => true,
                'status' => 'active',
            ]);
            $this->command->line("  ✓ Creado: {$mainWarehouse->name}");

            // Crear almacén de exhibición
            $displayWarehouse = Warehouse::create([
                'branch_id' => $sucursal->id,
                'name' => 'Sala de Exhibición',
                'description' => 'Productos en exhibición al público',
                'is_default' => false,
                'status' => 'active',
            ]);
            $this->command->line("  ✓ Creado: {$displayWarehouse->name}");

            // Crear almacén de reserva
            $reserveWarehouse = Warehouse::create([
                'branch_id' => $sucursal->id,
                'name' => 'Almacén de Reserva',
                'description' => 'Stock de reserva y productos de temporada',
                'is_default' => false,
                'status' => 'active',
            ]);
            $this->command->line("  ✓ Creado: {$reserveWarehouse->name}");

            // Obtener productos de esta sucursal
            $products = ProductBaseBranch::where('branch_id', $sucursal->id)
                ->with('productBase')
                ->get();

            if ($products->isEmpty()) {
                $this->command->warn("  No hay productos en esta sucursal");
                continue;
            }

            $this->command->line("  Agregando stock a {$products->count()} productos...");

            foreach ($products as $product) {
                // Stock en almacén principal (mayor cantidad)
                $mainStock = rand(50, 200);
                $service->registerMovement(
                    warehouse: $mainWarehouse,
                    productBaseBranch: $product,
                    type: 'in',
                    quantity: $mainStock,
                    user: $user,
                    reason: 'Stock inicial - Dashboard seed'
                );

                // Establecer stock mínimo
                $warehouseProduct = \App\Models\WarehouseProduct::where('warehouse_id', $mainWarehouse->id)
                    ->where('product_base_branch_id', $product->id)
                    ->first();
                
                if ($warehouseProduct) {
                    $warehouseProduct->min_stock = rand(10, 30);
                    $warehouseProduct->save();
                }

                // Stock en sala de exhibición (menor cantidad)
                $displayStock = rand(5, 30);
                $service->registerMovement(
                    warehouse: $displayWarehouse,
                    productBaseBranch: $product,
                    type: 'in',
                    quantity: $displayStock,
                    user: $user,
                    reason: 'Stock inicial - Dashboard seed'
                );

                // Stock en almacén de reserva (cantidad variable, algunos con stock bajo)
                $reserveStock = rand(0, 50);
                if ($reserveStock > 0) {
                    $service->registerMovement(
                        warehouse: $reserveWarehouse,
                        productBaseBranch: $product,
                        type: 'in',
                        quantity: $reserveStock,
                        user: $user,
                        reason: 'Stock inicial - Dashboard seed'
                    );

                    // Establecer stock mínimo para crear algunos casos de stock bajo
                    $warehouseProduct = \App\Models\WarehouseProduct::where('warehouse_id', $reserveWarehouse->id)
                        ->where('product_base_branch_id', $product->id)
                        ->first();
                    
                    if ($warehouseProduct && rand(0, 1)) {
                        $warehouseProduct->min_stock = $reserveStock + rand(5, 15); // Forzar stock bajo
                        $warehouseProduct->save();
                    }
                }
            }

            $this->command->line("  ✓ Stock agregado a todos los productos");
        }

        $this->command->newLine();
        $this->command->info('Seed del dashboard de inventario completado!');
        $this->command->newLine();
        $this->command->info('Resumen:');
        $this->command->line('  - Almacenes creados: ' . Warehouse::count());
        $this->command->line('  - Productos en almacenes: ' . \App\Models\WarehouseProduct::count());
        $this->command->line('  - Movimientos registrados: ' . \App\Models\InventoryMovement::count());
        $this->command->newLine();
        $this->command->info('Puedes acceder al dashboard en:');
        
        $firstSucursal = Sucursal::first();
        if ($firstSucursal) {
            $this->command->line('  /sucursales/' . $firstSucursal->id . '/inventario');
        }
    }
}
