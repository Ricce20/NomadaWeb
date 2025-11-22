<?php

namespace App\Console\Commands;

use App\Models\ProductBaseBranch;
use App\Models\Sucursal;
use App\Models\Warehouse;
use App\Models\WarehouseProduct;
use App\Services\InventoryService;
use Illuminate\Console\Command;

class VerifyStockMirror extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inventory:verify-stock-mirror';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verifica que ProductBaseBranch.stock sea un espejo sincronizado del inventario por almacén';

    /**
     * Execute the console command.
     */
    public function handle(InventoryService $inventoryService)
    {
        $this->info('🔍 Verificando sistema de espejo de stock...');
        $this->newLine();

        // 1. Verificar que existe al menos un producto en sucursal con almacenes
        $this->info('📦 Buscando productos de prueba...');
        
        $productBaseBranch = ProductBaseBranch::with(['warehouseProducts', 'branch'])
            ->whereHas('warehouseProducts')
            ->first();

        if (!$productBaseBranch) {
            $this->warn('⚠️  No hay productos con inventario en almacenes para verificar.');
            $this->info('💡 Crea un producto en una sucursal y registra movimientos de inventario primero.');
            return Command::FAILURE;
        }

        $this->info("✅ Producto encontrado: {$productBaseBranch->productBase->name}");
        $this->info("   Sucursal: {$productBaseBranch->branch->nombre}");
        $this->newLine();

        // 2. Mostrar estado actual
        $this->info('📊 Estado actual del stock:');
        $this->table(
            ['Almacén', 'Stock'],
            $productBaseBranch->warehouseProducts->map(function ($wp) {
                return [
                    $wp->warehouse->name,
                    $wp->stock,
                ];
            })
        );

        $sumFromWarehouses = $productBaseBranch->warehouseProducts->sum('stock');
        $stockInBranch = $productBaseBranch->stock;

        $this->info("📍 Suma de almacenes: {$sumFromWarehouses}");
        $this->info("📍 Stock en ProductBaseBranch: {$stockInBranch}");

        if ($sumFromWarehouses === $stockInBranch) {
            $this->info('✅ Stock sincronizado correctamente');
        } else {
            $this->warn('⚠️  Stock NO sincronizado');
            $this->info('🔧 Recalculando...');
            $productBaseBranch->recalculateStockFromWarehouses();
            $this->info("✅ Stock recalculado: {$productBaseBranch->stock}");
        }

        $this->newLine();

        // 3. Realizar movimientos de prueba
        $this->info('🧪 Realizando movimientos de prueba...');
        $this->newLine();

        $warehouse = $productBaseBranch->warehouseProducts->first()->warehouse;
        $user = \App\Models\User::first();

        // Movimiento 1: Entrada
        $this->info('📥 Movimiento 1: Entrada de 10 unidades');
        $previousStock = $productBaseBranch->stock;
        
        $movement1 = $inventoryService->registerMovement(
            $warehouse,
            $productBaseBranch,
            'in',
            10,
            $user,
            'Prueba de sincronización automática - Entrada'
        );

        $productBaseBranch->refresh();
        $newStock = $productBaseBranch->stock;

        $this->info("   Stock anterior: {$previousStock}");
        $this->info("   Stock nuevo: {$newStock}");
        $this->info("   Diferencia: " . ($newStock - $previousStock));

        if ($newStock === $previousStock + 10) {
            $this->info('   ✅ Stock sincronizado correctamente después de entrada');
        } else {
            $this->error('   ❌ Stock NO sincronizado después de entrada');
            return Command::FAILURE;
        }

        $this->newLine();

        // Movimiento 2: Ajuste
        $this->info('🔧 Movimiento 2: Ajuste a 50 unidades');
        $previousStock = $productBaseBranch->stock;
        
        $movement2 = $inventoryService->registerMovement(
            $warehouse,
            $productBaseBranch,
            'adjust',
            50,
            $user,
            'Prueba de sincronización automática - Ajuste'
        );

        $productBaseBranch->refresh();
        $newStock = $productBaseBranch->stock;

        $this->info("   Stock anterior: {$previousStock}");
        $this->info("   Stock nuevo: {$newStock}");

        // Verificar que el stock del almacén es 50
        $warehouseStock = WarehouseProduct::where('warehouse_id', $warehouse->id)
            ->where('product_base_branch_id', $productBaseBranch->id)
            ->value('stock');

        if ($warehouseStock === 50 && $newStock === 50) {
            $this->info('   ✅ Stock sincronizado correctamente después de ajuste');
        } else {
            $this->error('   ❌ Stock NO sincronizado después de ajuste');
            return Command::FAILURE;
        }

        $this->newLine();

        // 4. Verificar que la suma sigue siendo correcta
        $this->info('🔍 Verificación final:');
        $productBaseBranch->refresh();
        $finalSum = $productBaseBranch->warehouseProducts->sum('stock');
        $finalBranchStock = $productBaseBranch->stock;

        $this->info("   Suma de almacenes: {$finalSum}");
        $this->info("   Stock en ProductBaseBranch: {$finalBranchStock}");

        if ($finalSum === $finalBranchStock) {
            $this->info('   ✅ Sincronización perfecta');
        } else {
            $this->error('   ❌ Desincronización detectada');
            return Command::FAILURE;
        }

        $this->newLine();

        // 5. Resumen final
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info('✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE');
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->newLine();
        $this->info('📋 Resumen:');
        $this->info('   • ProductBaseBranch.stock funciona como espejo');
        $this->info('   • Se sincroniza automáticamente después de cada movimiento');
        $this->info('   • Movimientos de entrada (in) actualizan correctamente');
        $this->info('   • Movimientos de ajuste (adjust) actualizan correctamente');
        $this->info('   • La suma de warehouse_products.stock = ProductBaseBranch.stock');
        $this->newLine();
        $this->info('🎯 El sistema de espejo de stock está funcionando correctamente.');

        return Command::SUCCESS;
    }
}
