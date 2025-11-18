<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ProductBase;
use App\Models\Sucursal;
use App\Models\ProductBaseBranch;

class DebugProductCatalog extends Command
{
    protected $signature = 'debug:product-catalog {sucursal_id?}';
    protected $description = 'Debug product catalog visibility';

    public function handle()
    {
        $sucursalId = $this->argument('sucursal_id');
        
        $this->info('=== DEBUG: Product Catalog ===');
        $this->newLine();
        
        // Total de productos base
        $totalProducts = ProductBase::count();
        $this->info("Total ProductBase en DB: {$totalProducts}");
        
        // Productos activos
        $activeProducts = ProductBase::where('is_active', true)->count();
        $this->info("ProductBase activos (is_active=true): {$activeProducts}");
        
        // Productos aprobados
        $approvedProducts = ProductBase::where('approval_status', 'approved')->count();
        $this->info("ProductBase aprobados (approval_status='approved'): {$approvedProducts}");
        
        // Productos activos Y aprobados
        $catalogProducts = ProductBase::where('is_active', true)
            ->where('approval_status', 'approved')
            ->count();
        $this->info("ProductBase en catálogo (activos Y aprobados): {$catalogProducts}");
        
        $this->newLine();
        
        // Listar algunos productos
        $this->info('=== Primeros 5 productos del catálogo ===');
        $products = ProductBase::where('is_active', true)
            ->where('approval_status', 'approved')
            ->with(['brand', 'category', 'uom'])
            ->limit(5)
            ->get();
            
        foreach ($products as $product) {
            $this->line("ID: {$product->id} | SKU: {$product->sku_base} | Nombre: {$product->name}");
            $this->line("  Marca: {$product->brand?->name} | Categoría: {$product->category?->name}");
        }
        
        if ($sucursalId) {
            $this->newLine();
            $sucursal = Sucursal::find($sucursalId);
            if ($sucursal) {
                $this->info("=== Sucursal: {$sucursal->nombre} (ID: {$sucursalId}) ===");
                
                $addedCount = ProductBaseBranch::where('branch_id', $sucursalId)->count();
                $this->info("Productos ya agregados a esta sucursal: {$addedCount}");
                
                $availableCount = ProductBase::where('is_active', true)
                    ->where('approval_status', 'approved')
                    ->whereDoesntHave('prices', function($q) use ($sucursalId) {
                        $q->where('branch_id', $sucursalId);
                    })
                    ->count();
                $this->info("Productos disponibles para agregar: {$availableCount}");
            } else {
                $this->error("Sucursal {$sucursalId} no encontrada");
            }
        }
        
        return 0;
    }
}
