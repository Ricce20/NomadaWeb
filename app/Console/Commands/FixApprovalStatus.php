<?php

namespace App\Console\Commands;

use App\Models\ProductBase;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixApprovalStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fix:approval-status {--dry-run : Mostrar cambios sin aplicarlos}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Normalizar valores de approval_status en product_bases';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Verificando approval_status en product_bases...');
        $this->newLine();

        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('⚠️  Modo DRY-RUN: No se aplicarán cambios');
            $this->newLine();
        }

        // Verificar productos con approval_status inválido o null
        $invalidProducts = DB::table('product_bases')
            ->whereNotIn('approval_status', [
                ProductBase::STATUS_APPROVED,
                ProductBase::STATUS_PENDING,
                ProductBase::STATUS_REJECTED,
                ProductBase::STATUS_LOCAL,
                ProductBase::STATUS_ARCHIVED,
            ])
            ->orWhereNull('approval_status')
            ->get();

        if ($invalidProducts->isEmpty()) {
            $this->info('✅ Todos los productos tienen approval_status válido');
            return Command::SUCCESS;
        }

        $this->warn("⚠️  Encontrados {$invalidProducts->count()} productos con approval_status inválido:");
        $this->newLine();

        $table = [];
        foreach ($invalidProducts as $product) {
            $table[] = [
                'ID' => $product->id,
                'Nombre' => $product->name,
                'Status Actual' => $product->approval_status ?? 'NULL',
                'is_active' => $product->is_active ? 'true' : 'false',
                'origin_negocio_id' => $product->origin_negocio_id ?? 'NULL',
            ];
        }

        $this->table(['ID', 'Nombre', 'Status Actual', 'is_active', 'origin_negocio_id'], $table);
        $this->newLine();

        if (!$dryRun) {
            if (!$this->confirm('¿Deseas normalizar estos productos?', true)) {
                $this->info('Operación cancelada');
                return Command::SUCCESS;
            }
        }

        // Normalizar productos
        $fixed = 0;

        foreach ($invalidProducts as $product) {
            $newStatus = $this->determineCorrectStatus($product);
            
            $this->line("  - Producto #{$product->id}: '{$product->approval_status}' → '{$newStatus}'");

            if (!$dryRun) {
                DB::table('product_bases')
                    ->where('id', $product->id)
                    ->update(['approval_status' => $newStatus]);
                $fixed++;
            }
        }

        $this->newLine();

        if ($dryRun) {
            $this->info("✅ Se normalizarían {$invalidProducts->count()} productos");
            $this->info('Ejecuta sin --dry-run para aplicar los cambios');
        } else {
            $this->info("✅ {$fixed} productos normalizados correctamente");
        }

        return Command::SUCCESS;
    }

    /**
     * Determinar el estado correcto basado en las características del producto
     */
    private function determineCorrectStatus($product): string
    {
        // Si tiene origin_negocio_id, es un producto local
        if ($product->origin_negocio_id !== null) {
            return ProductBase::STATUS_LOCAL;
        }

        // Si está inactivo, probablemente fue archivado
        if (!$product->is_active) {
            return ProductBase::STATUS_ARCHIVED;
        }

        // Por defecto, marcar como aprobado (productos corporativos)
        return ProductBase::STATUS_APPROVED;
    }
}
