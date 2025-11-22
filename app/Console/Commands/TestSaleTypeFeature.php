<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ProductBaseBranch;

class TestSaleTypeFeature extends Command
{
    protected $signature = 'sale-type:test';
    protected $description = 'Verifica que la funcionalidad de sale_type esté correctamente implementada';

    public function handle()
    {
        $this->info('=== VERIFICACIÓN DE FUNCIONALIDAD SALE_TYPE ===');
        $this->newLine();

        // 1. Verificar constantes del modelo
        $this->info('1. Verificando constantes del modelo...');
        $this->line('   - SALE_TYPE_UNIT: ' . ProductBaseBranch::SALE_TYPE_UNIT);
        $this->line('   - SALE_TYPE_WEIGHT: ' . ProductBaseBranch::SALE_TYPE_WEIGHT);
        $this->line('   - SALE_TYPE_LENGTH: ' . ProductBaseBranch::SALE_TYPE_LENGTH);
        $this->line('   - SALE_TYPE_VOLUME: ' . ProductBaseBranch::SALE_TYPE_VOLUME);
        $this->line('   - SALE_TYPE_AREA: ' . ProductBaseBranch::SALE_TYPE_AREA);
        $this->line('   - Total tipos: ' . count(ProductBaseBranch::SALE_TYPES));

        // 2. Verificar que sale_type está en fillable
        $this->newLine();
        $this->info('2. Verificando configuración del modelo...');
        $model = new ProductBaseBranch();
        $fillable = $model->getFillable();
        $hasSaleType = in_array('sale_type', $fillable);
        $this->line('   - sale_type en fillable: ' . ($hasSaleType ? '✓ Sí' : '✗ No'));

        // 3. Verificar casts
        $casts = $model->getCasts();
        $hasCast = isset($casts['sale_type']);
        $this->line('   - sale_type tiene cast: ' . ($hasCast ? '✓ Sí (' . $casts['sale_type'] . ')' : '✗ No'));

        // 4. Verificar productos existentes
        $this->newLine();
        $this->info('3. Verificando productos en base de datos...');
        $total = ProductBaseBranch::count();
        $this->line('   - Total productos en sucursales: ' . $total);

        if ($total > 0) {
            $withSaleType = ProductBaseBranch::whereNotNull('sale_type')->count();
            $withoutSaleType = ProductBaseBranch::whereNull('sale_type')->count();
            
            $this->line('   - Con sale_type: ' . $withSaleType);
            $this->line('   - Sin sale_type: ' . $withoutSaleType);

            // Mostrar distribución de tipos
            if ($withSaleType > 0) {
                $this->newLine();
                $this->line('   Distribución de tipos de venta:');
                foreach (ProductBaseBranch::SALE_TYPES as $type) {
                    $count = ProductBaseBranch::where('sale_type', $type)->count();
                    if ($count > 0) {
                        $this->line("     - {$type}: {$count}");
                    }
                }
            }

            // Mostrar ejemplo
            $example = ProductBaseBranch::with('productBase')->first();
            if ($example) {
                $this->newLine();
                $this->line('   Ejemplo de producto:');
                $this->line('     - ID: ' . $example->id);
                $this->line('     - Nombre: ' . ($example->productBase->name ?? 'N/A'));
                $this->line('     - Precio: $' . $example->price);
                $this->line('     - Stock: ' . $example->stock);
                $this->line('     - Sale Type: ' . ($example->sale_type ?? 'null'));
            }
        }

        // 5. Verificar Form Requests
        $this->newLine();
        $this->info('4. Verificando Form Requests...');
        $requests = [
            'App\Http\Requests\Ownership\StoreBranchProductRequest',
            'App\Http\Requests\Ownership\UpdateBranchProductRequest',
            'App\Http\Requests\QuickAddProductRequest',
        ];

        foreach ($requests as $requestClass) {
            $exists = class_exists($requestClass);
            $this->line('   - ' . class_basename($requestClass) . ': ' . ($exists ? '✓ Existe' : '✗ No existe'));
        }

        $this->newLine();
        $this->info('=== VERIFICACIÓN COMPLETADA ===');
        $this->newLine();

        // Sugerencias
        if ($withoutSaleType ?? 0 > 0) {
            $this->warn('⚠ Hay productos sin sale_type. Considera ejecutar:');
            $this->line('   ProductBaseBranch::whereNull(\'sale_type\')->update([\'sale_type\' => \'unit\']);');
        }

        return Command::SUCCESS;
    }
}
