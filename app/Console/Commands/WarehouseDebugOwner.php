<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\Almacen;
use App\Models\Sucursal;

class WarehouseDebugOwner extends Command
{
    protected $signature = 'warehouse:debug-owner {email?}';
    protected $description = 'Depura y valida la sincronización de almacenes entre sistemas';

    public function handle()
    {
        $this->info('╔════════════════════════════════════════════════════════════╗');
        $this->info('║  DEBUG: SINCRONIZACIÓN DE ALMACENES OWNER                 ║');
        $this->info('╚════════════════════════════════════════════════════════════╝');
        $this->newLine();

        // 1. Buscar usuario owner
        $email = $this->argument('email') ?? 'eduardo@example.com';
        $owner = User::where('email', $email)
            ->where('type', User::TYPE_OWNER)
            ->first();

        if (!$owner) {
            $this->error("✗ No se encontró usuario owner con email: {$email}");
            $this->warn('Buscando cualquier usuario owner...');
            $owner = User::where('type', User::TYPE_OWNER)->first();
            
            if (!$owner) {
                $this->error('✗ No hay usuarios owner en el sistema');
                return Command::FAILURE;
            }
        }

        $this->info("✓ Usuario owner: {$owner->name} ({$owner->email})");
        $this->newLine();

        // 2. Obtener negocio y sucursal
        $negocio = $owner->negocio()->first();
        if (!$negocio) {
            $this->error('✗ El owner no tiene negocio asignado');
            return Command::FAILURE;
        }

        $this->info("✓ Negocio: {$negocio->nombre}");

        $sucursal = $negocio->sucursales()->first();
        if (!$sucursal) {
            $this->error('✗ El negocio no tiene sucursales');
            return Command::FAILURE;
        }

        $this->info("✓ Sucursal principal: {$sucursal->nombre} (ID: {$sucursal->id})");
        $this->newLine();

        // 3. Analizar almacenes en ambos sistemas
        $this->info('═══════════════════════════════════════════════════════════');
        $this->info('ANÁLISIS DE ALMACENES');
        $this->info('═══════════════════════════════════════════════════════════');
        $this->newLine();

        // Sistema antiguo (almacenes)
        $this->info('📦 SISTEMA ANTIGUO (tabla: almacenes)');
        $almacenesOld = Almacen::where('sucursal_id', $sucursal->id)->get();
        
        if ($almacenesOld->isEmpty()) {
            $this->line('   No hay almacenes en el sistema antiguo');
        } else {
            $this->table(
                ['ID', 'Nombre', 'Activo', 'Ubicación'],
                $almacenesOld->map(fn($a) => [
                    $a->id,
                    $a->nombre,
                    $a->activo ? '✓ Sí' : '✗ No',
                    $a->ubicacion ?? 'N/A',
                ])
            );
        }
        $this->newLine();

        // Sistema nuevo (warehouses)
        $this->info('🏢 SISTEMA NUEVO (tabla: warehouses)');
        $warehousesAll = Warehouse::where('branch_id', $sucursal->id)->get();
        
        if ($warehousesAll->isEmpty()) {
            $this->line('   No hay almacenes en el sistema nuevo');
        } else {
            $this->table(
                ['ID', 'Nombre', 'Status', 'Default', 'Productos'],
                $warehousesAll->map(fn($w) => [
                    $w->id,
                    $w->name,
                    $w->status,
                    $w->is_default ? '✓' : '',
                    $w->warehouseProducts()->count(),
                ])
            );
        }
        $this->newLine();

        // 4. Filtrar visibles vs ocultos
        $this->info('═══════════════════════════════════════════════════════════');
        $this->info('VISIBILIDAD EN DASHBOARD DE INVENTARIO');
        $this->info('═══════════════════════════════════════════════════════════');
        $this->newLine();

        $this->info("URL del dashboard: /sucursales/{$sucursal->id}/inventario");
        $this->newLine();

        $warehousesVisible = $warehousesAll->where('status', 'active');
        $warehousesHidden = $warehousesAll->where('status', '!=', 'active');

        // Visibles
        $this->info('✓ ALMACENES VISIBLES (status = active):');
        if ($warehousesVisible->isEmpty()) {
            $this->warn('   No hay almacenes visibles');
            $this->line('   El dashboard mostrará: "No hay almacenes registrados"');
        } else {
            foreach ($warehousesVisible as $w) {
                $products = $w->warehouseProducts()->count();
                $stock = $w->warehouseProducts()->sum('stock');
                $this->line("   • {$w->name}");
                $this->line("     - ID: {$w->id}");
                $this->line("     - Productos: {$products}");
                $this->line("     - Stock total: {$stock}");
                $this->line("     - Default: " . ($w->is_default ? 'Sí' : 'No'));
            }
        }
        $this->newLine();

        // Ocultos
        if ($warehousesHidden->isNotEmpty()) {
            $this->warn('✗ ALMACENES OCULTOS (status != active):');
            foreach ($warehousesHidden as $w) {
                $this->line("   • {$w->name} (status: {$w->status})");
            }
            $this->newLine();
        }

        // 5. Verificar sincronización
        $this->info('═══════════════════════════════════════════════════════════');
        $this->info('ESTADO DE SINCRONIZACIÓN');
        $this->info('═══════════════════════════════════════════════════════════');
        $this->newLine();

        $sincronizados = 0;
        $noSincronizados = 0;

        foreach ($almacenesOld as $almacen) {
            $warehouse = $warehousesAll->where('name', $almacen->nombre)->first();
            
            if ($warehouse) {
                $sincronizados++;
                $statusMatch = ($almacen->activo && $warehouse->status === 'active') || 
                               (!$almacen->activo && $warehouse->status === 'inactive');
                
                if ($statusMatch) {
                    $this->info("✓ '{$almacen->nombre}' - Sincronizado correctamente");
                } else {
                    $this->warn("⚠ '{$almacen->nombre}' - Sincronizado pero status no coincide");
                    $this->line("   Almacen.activo: " . ($almacen->activo ? 'true' : 'false'));
                    $this->line("   Warehouse.status: {$warehouse->status}");
                }
            } else {
                $noSincronizados++;
                $this->error("✗ '{$almacen->nombre}' - NO sincronizado con warehouses");
            }
        }

        $this->newLine();
        $this->info("Resumen de sincronización:");
        $this->line("  - Sincronizados: {$sincronizados}");
        $this->line("  - No sincronizados: {$noSincronizados}");
        $this->newLine();

        // 6. Recomendaciones
        if ($noSincronizados > 0) {
            $this->warn('RECOMENDACIÓN:');
            $this->line('Hay almacenes en el sistema antiguo que no están sincronizados.');
            $this->line('Ejecuta: php artisan warehouse:sync-old-to-new');
            $this->newLine();
        }

        if ($warehousesVisible->isEmpty()) {
            $this->warn('ADVERTENCIA:');
            $this->line('No hay almacenes visibles en el dashboard de inventario.');
            $this->line('Crea un almacén desde el panel del owner o ejecuta:');
            $this->line('  php artisan warehouse:owner-test');
            $this->newLine();
        }

        return Command::SUCCESS;
    }
}
