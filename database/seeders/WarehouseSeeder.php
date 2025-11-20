<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\Warehouse;
use App\Models\ProductBaseBranch;
use App\Services\InventoryService;
use App\Models\User;

class WarehouseSeeder extends Seeder
{
    /**
     * Seed de ejemplo para crear almacenes y movimientos de prueba.
     * 
     * Uso: php artisan db:seed --class=WarehouseSeeder
     */
    public function run(): void
    {
        $this->command->info('Iniciando seed de almacenes...');

        // Verificar que existan sucursales
        $branches = Branch::all();
        if ($branches->isEmpty()) {
            $this->command->warn('No hay sucursales en la base de datos. Crea al menos una sucursal primero.');
            return;
        }

        $service = new InventoryService();
        $user = User::first(); // Usuario para registrar movimientos

        foreach ($branches as $branch) {
            $this->command->info("Procesando sucursal: {$branch->name}");

            // Crear almacén principal
            $mainWarehouse = Warehouse::create([
                'branch_id' => $branch->id,
                'name' => 'Almacén Principal',
                'description' => 'Almacén principal de la sucursal',
                'is_default' => true,
                'status' => 'active',
            ]);
            $this->command->line("  ✓ Creado: {$mainWarehouse->name}");

            // Crear almacén de exhibición
            $displayWarehouse = Warehouse::create([
                'branch_id' => $branch->id,
                'name' => 'Almacén de Exhibición',
                'description' => 'Productos en exhibición al público',
                'is_default' => false,
                'status' => 'active',
            ]);
            $this->command->line("  ✓ Creado: {$displayWarehouse->name}");

            // Obtener productos de esta sucursal
            $products = ProductBaseBranch::where('branch_id', $branch->id)
                ->limit(5) // Solo los primeros 5 productos para el ejemplo
                ->get();

            if ($products->isEmpty()) {
                $this->command->warn("  No hay productos en esta sucursal");
                continue;
            }

            // Agregar stock inicial a los productos
            foreach ($products as $product) {
                // Stock en almacén principal
                $service->registerMovement(
                    warehouse: $mainWarehouse,
                    productBaseBranch: $product,
                    type: 'in',
                    quantity: rand(50, 200),
                    user: $user,
                    reason: 'Stock inicial - Seed de prueba'
                );

                // Stock en almacén de exhibición
                $service->registerMovement(
                    warehouse: $displayWarehouse,
                    productBaseBranch: $product,
                    type: 'in',
                    quantity: rand(10, 30),
                    user: $user,
                    reason: 'Stock inicial - Seed de prueba'
                );
            }

            $this->command->line("  ✓ Agregado stock inicial a {$products->count()} productos");
        }

        $this->command->info('Seed de almacenes completado exitosamente!');
        $this->command->newLine();
        $this->command->info('Resumen:');
        $this->command->line('  - Almacenes creados: ' . Warehouse::count());
        $this->command->line('  - Productos en almacenes: ' . \App\Models\WarehouseProduct::count());
        $this->command->line('  - Movimientos registrados: ' . \App\Models\InventoryMovement::count());
    }
}
