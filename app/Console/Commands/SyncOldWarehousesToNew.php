<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Almacen;
use App\Models\Warehouse;

class SyncOldWarehousesToNew extends Command
{
    protected $signature = 'warehouse:sync-old-to-new';
    protected $description = 'Sincroniza almacenes del sistema antiguo (almacenes) al nuevo (warehouses)';

    public function handle()
    {
        $this->info('╔════════════════════════════════════════════════════════════╗');
        $this->info('║  SINCRONIZACIÓN: almacenes → warehouses                   ║');
        $this->info('╚════════════════════════════════════════════════════════════╝');
        $this->newLine();

        $almacenes = Almacen::all();

        if ($almacenes->isEmpty()) {
            $this->warn('No hay almacenes en el sistema antiguo para sincronizar');
            return Command::SUCCESS;
        }

        $this->info("Encontrados {$almacenes->count()} almacenes en el sistema antiguo");
        $this->newLine();

        $created = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($almacenes as $almacen) {
            // Buscar si ya existe en warehouses
            $warehouse = Warehouse::where('branch_id', $almacen->sucursal_id)
                ->where('name', $almacen->nombre)
                ->first();

            if ($warehouse) {
                // Actualizar si hay diferencias
                $needsUpdate = false;
                $changes = [];

                if ($warehouse->description !== $almacen->descripcion) {
                    $needsUpdate = true;
                    $changes[] = 'descripción';
                }

                $expectedStatus = $almacen->activo ? 'active' : 'inactive';
                if ($warehouse->status !== $expectedStatus) {
                    $needsUpdate = true;
                    $changes[] = 'status';
                }

                if ($needsUpdate) {
                    $warehouse->update([
                        'description' => $almacen->descripcion ?? $warehouse->description,
                        'status' => $expectedStatus,
                    ]);
                    $updated++;
                    $this->line("✓ Actualizado: {$almacen->nombre} (" . implode(', ', $changes) . ")");
                } else {
                    $skipped++;
                    $this->line("→ Sin cambios: {$almacen->nombre}");
                }
            } else {
                // Crear nuevo warehouse
                Warehouse::create([
                    'branch_id' => $almacen->sucursal_id,
                    'name' => $almacen->nombre,
                    'description' => $almacen->descripcion ?? 'Sincronizado desde sistema antiguo',
                    'is_default' => false,
                    'status' => $almacen->activo ? 'active' : 'inactive',
                ]);
                $created++;
                $this->info("✓ Creado: {$almacen->nombre}");
            }
        }

        $this->newLine();
        $this->info('═══════════════════════════════════════════════════════════');
        $this->info('RESUMEN DE SINCRONIZACIÓN');
        $this->info('═══════════════════════════════════════════════════════════');
        $this->line("  - Creados: {$created}");
        $this->line("  - Actualizados: {$updated}");
        $this->line("  - Sin cambios: {$skipped}");
        $this->line("  - Total procesados: {$almacenes->count()}");
        $this->newLine();

        if ($created > 0 || $updated > 0) {
            $this->info('✓ Sincronización completada exitosamente');
            $this->line('Los almacenes ahora son visibles en el dashboard de inventario');
        }

        return Command::SUCCESS;
    }
}
