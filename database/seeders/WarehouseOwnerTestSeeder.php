<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Negocio;
use App\Models\Sucursal;
use App\Models\Warehouse;
use App\Models\ProductBase;
use App\Models\ProductBaseBranch;
use App\Services\InventoryService;

class WarehouseOwnerTestSeeder extends Seeder
{
    /**
     * Seed de prueba específico para el usuario owner (eduardo@example.com)
     * 
     * Uso: php artisan db:seed --class=WarehouseOwnerTestSeeder
     */
    public function run(): void
    {
        $this->command->info('=== CREANDO DATOS DE PRUEBA PARA OWNER ===');
        $this->command->newLine();

        // 1. Buscar el usuario owner
        $this->command->info('1. Buscando usuario owner...');
        $owner = User::where('email', 'eduardo@example.com')
            ->where('type', User::TYPE_OWNER)
            ->first();

        if (!$owner) {
            $this->command->error('   ✗ No se encontró el usuario eduardo@example.com con tipo owner');
            $this->command->warn('   Creando usuario de prueba...');
            
            // Crear usuario owner de prueba
            $owner = User::create([
                'name' => 'Eduardo Owner',
                'email' => 'eduardo@example.com',
                'password' => bcrypt('password'),
                'type' => User::TYPE_OWNER,
                'username' => 'eduardo',
            ]);
            $this->command->info('   ✓ Usuario owner creado');
        } else {
            $this->command->info("   ✓ Usuario encontrado: {$owner->name}");
        }

        // 2. Obtener o crear negocio del owner
        $this->command->newLine();
        $this->command->info('2. Verificando negocio del owner...');
        $negocio = $owner->negocio()->first();

        if (!$negocio) {
            $this->command->warn('   No tiene negocio. Creando...');
            $negocio = Negocio::create([
                'nombre' => 'Negocio de Prueba',
                'correo' => 'negocio@example.com',
                'telefono' => '1234567890',
                'activo' => true,
                'descripcion' => 'Negocio creado para pruebas',
                'user_id' => $owner->id,
            ]);
            $this->command->info('   ✓ Negocio creado');
        } else {
            $this->command->info("   ✓ Negocio encontrado: {$negocio->nombre}");
        }

        // 3. Obtener o crear sucursal
        $this->command->newLine();
        $this->command->info('3. Verificando sucursal del negocio...');
        $sucursal = $negocio->sucursales()->first();

        if (!$sucursal) {
            $this->command->warn('   No tiene sucursal. Creando...');
            $sucursal = Sucursal::create([
                'nombre' => 'Sucursal Principal',
                'direccion' => 'Calle Principal 123',
                'telefono' => '1234567890',
                'negocio_id' => $negocio->id,
            ]);
            $this->command->info('   ✓ Sucursal creada');
        } else {
            $this->command->info("   ✓ Sucursal encontrada: {$sucursal->nombre} (ID: {$sucursal->id})");
        }

        // 4. Crear o obtener Branch correspondiente a la Sucursal
        $this->command->newLine();
        $this->command->info('4. Verificando Branch para la sucursal...');
        
        // Buscar si ya existe un Branch con el mismo ID que la sucursal
        $branch = \App\Models\Branch::find($sucursal->id);
        
        if (!$branch) {
            $this->command->warn('   No existe Branch. Creando...');
            $branch = \App\Models\Branch::create([
                'id' => $sucursal->id,
                'name' => $sucursal->nombre,
                'code' => 'BR-' . str_pad($sucursal->id, 4, '0', STR_PAD_LEFT),
                'address' => $sucursal->direccion_completa ?? 'Sin dirección',
                'phone' => $sucursal->telefono,
                'is_active' => true,
            ]);
            $this->command->info("   ✓ Branch creado: {$branch->name}");
        } else {
            $this->command->info("   ✓ Branch encontrado: {$branch->name}");
        }

        // 5. Verificar si ya existe almacén de prueba
        $this->command->newLine();
        $this->command->info('5. Creando almacén de prueba...');
        $existingWarehouse = Warehouse::where('branch_id', $branch->id)
            ->where('name', 'Almacén Principal - Pruebas')
            ->first();

        if ($existingWarehouse) {
            $this->command->warn('   ⚠ Ya existe un almacén de prueba. Eliminando para recrear...');
            $existingWarehouse->delete();
        }

        $warehouse = Warehouse::create([
            'branch_id' => $branch->id,
            'name' => 'Almacén Principal - Pruebas',
            'description' => 'Almacén creado automáticamente para pruebas',
            'is_default' => true,
            'status' => 'active',
        ]);
        $this->command->info("   ✓ Almacén creado: {$warehouse->name}");

        // 6. Obtener o crear productos
        $this->command->newLine();
        $this->command->info('6. Verificando productos en la sucursal...');
        
        $products = ProductBaseBranch::where('branch_id', $sucursal->id)
            ->with('productBase')
            ->limit(2)
            ->get();

        if ($products->count() < 2) {
            $this->command->warn('   Menos de 2 productos encontrados. Creando productos de ejemplo...');
            
            // Obtener o crear marca, categoría y unidad
            $brand = \App\Models\Brand::firstOrCreate(
                ['name' => 'Marca Genérica'],
                [
                    'description' => 'Marca de prueba',
                    'slug' => 'marca-generica',
                ]
            );
            
            $category = \App\Models\Category::firstOrCreate(
                ['name' => 'Categoría General'],
                [
                    'description' => 'Categoría de prueba',
                    'slug' => 'categoria-general',
                ]
            );
            
            $unit = \App\Models\Unit::firstOrCreate(
                ['name' => 'Unidad', 'abbreviation' => 'ud'],
                ['description' => 'Unidad de medida']
            );

            // Crear productos base si no existen
            for ($i = $products->count(); $i < 2; $i++) {
                $productBase = ProductBase::create([
                    'sku_base' => 'TEST-' . uniqid(),
                    'name' => 'Producto de Prueba ' . ($i + 1),
                    'brand_id' => $brand->id,
                    'category_id' => $category->id,
                    'uom_id' => $unit->id,
                    'is_active' => true,
                    'approval_status' => ProductBase::STATUS_LOCAL,
                    'origin_negocio_id' => $negocio->id,
                    'created_by' => $owner->id,
                ]);

                $productBranch = ProductBaseBranch::create([
                    'product_base_id' => $productBase->id,
                    'branch_id' => $sucursal->id,
                    'price' => rand(10, 100),
                    'stock' => 0,
                    'sale_type' => 'unit',
                ]);

                $products->push($productBranch);
                $this->command->info("   ✓ Producto creado: {$productBase->name}");
            }
        } else {
            $this->command->info("   ✓ Productos encontrados: {$products->count()}");
        }

        // 7. Crear inventario en el almacén
        $this->command->newLine();
        $this->command->info('7. Creando inventario en el almacén...');
        
        $service = new InventoryService();
        $stocks = [25, 8]; // Primer producto: 25, Segundo: 8
        $minStocks = [5, 5];

        foreach ($products->take(2) as $index => $product) {
            $productName = $product->productBase->name ?? 'Producto ' . ($index + 1);
            $stock = $stocks[$index];
            $minStock = $minStocks[$index];

            // Registrar movimiento de entrada
            $movement = $service->registerMovement(
                warehouse: $warehouse,
                productBaseBranch: $product,
                type: 'in',
                quantity: $stock,
                user: $owner,
                reason: 'Carga de prueba'
            );

            // Establecer stock mínimo
            $warehouseProduct = \App\Models\WarehouseProduct::where('warehouse_id', $warehouse->id)
                ->where('product_base_branch_id', $product->id)
                ->first();
            
            if ($warehouseProduct) {
                $warehouseProduct->min_stock = $minStock;
                $warehouseProduct->save();
            }

            $this->command->info("   ✓ {$productName}: Stock {$stock}, Min {$minStock}");
        }

        // 8. Resumen final
        $this->command->newLine();
        $this->command->info('=== DATOS DE PRUEBA CREADOS EXITOSAMENTE ===');
        $this->command->newLine();
        $this->command->line('Resumen:');
        $this->command->line("  - Usuario: {$owner->email}");
        $this->command->line("  - Negocio: {$negocio->nombre}");
        $this->command->line("  - Sucursal: {$sucursal->nombre} (ID: {$sucursal->id})");
        $this->command->line("  - Branch: {$branch->name} (ID: {$branch->id})");
        $this->command->line("  - Almacén: {$warehouse->name}");
        $this->command->line("  - Productos: 2");
        $this->command->line("  - Stock total: " . array_sum($stocks));
        $this->command->newLine();
        $this->command->info('Inicia sesión como owner y visita:');
        $this->command->line("  /sucursales/{$sucursal->id}/inventario");
        $this->command->newLine();
    }
}
