<?php

namespace Database\Seeders;

use App\Models\ProductBase;
use App\Models\ProductBaseBranch;
use App\Models\Sucursal;
use Illuminate\Database\Seeder;

class ProductBaseBranchSeeder extends Seeder
{
    /**
     * Run the database seeders.
     */
    public function run(): void
    {
        // Buscar la primera sucursal (Matriz)
        $sucursal = Sucursal::where('nombre', 'like', '%Matriz%')
            ->orWhere('nombre', 'like', '%Principal%')
            ->first();

        // Si no existe, tomar la primera sucursal disponible
        if (!$sucursal) {
            $sucursal = Sucursal::first();
        }

        if (!$sucursal) {
            $this->command->warn('No hay sucursales disponibles. Crea una sucursal primero.');
            return;
        }

        $this->command->info("Usando sucursal: {$sucursal->nombre} (ID: {$sucursal->id})");

        // Tomar 5 productos base existentes
        $productBases = ProductBase::where('is_active', true)
            ->limit(5)
            ->get();

        if ($productBases->isEmpty()) {
            $this->command->warn('No hay productos base disponibles. Ejecuta el seeder de productos primero.');
            return;
        }

        $this->command->info("Encontrados {$productBases->count()} productos base");

        // Crear relaciones con precios de ejemplo (idempotente)
        foreach ($productBases as $index => $productBase) {
            // Verificar si ya existe la relación
            $exists = ProductBaseBranch::where('product_base_id', $productBase->id)
                ->where('sucursal_id', $sucursal->id)
                ->exists();

            if ($exists) {
                $this->command->info("  - {$productBase->name}: Ya existe, omitiendo");
                continue;
            }

            // Crear precio de ejemplo
            $price = rand(50, 500) + (rand(0, 99) / 100); // Precio entre 50.00 y 500.99
            $stock = rand(0, 100);

            ProductBaseBranch::create([
                'product_base_id' => $productBase->id,
                'sucursal_id' => $sucursal->id,
                'price' => $price,
                'stock' => $stock,
            ]);

            $this->command->info("  ✓ {$productBase->name}: \${$price} (Stock: {$stock})");
        }

        $this->command->info('Seeder completado exitosamente');
    }
}
