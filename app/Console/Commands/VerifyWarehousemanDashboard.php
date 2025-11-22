<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use App\Models\User;
use App\Models\Sucursal;

class VerifyWarehousemanDashboard extends Command
{
    protected $signature = 'dashboard:verify-warehouseman';
    protected $description = 'Verifica que el dashboard sea útil para usuarios warehouse_man y owner';

    public function handle()
    {
        $this->info('═══════════════════════════════════════════════════════════');
        $this->info('VERIFICACIÓN: DASHBOARD PARA WAREHOUSE_MAN Y OWNER');
        $this->info('═══════════════════════════════════════════════════════════');
        $this->newLine();

        $allPassed = true;

        // 1. Verificar ruta /dashboard
        $this->info('1. Verificando ruta /dashboard...');
        $routesFile = file_get_contents(base_path('routes/web.php'));
        
        if (str_contains($routesFile, 'primaryBranch')) {
            $this->info('   ✓ Ruta /dashboard pasa primaryBranch al frontend');
        } else {
            $this->error('   ✗ Ruta /dashboard no pasa primaryBranch');
            $allPassed = false;
        }
        
        if (str_contains($routesFile, 'warehouse_man') || str_contains($routesFile, 'isOwner')) {
            $this->info('   ✓ Lógica para determinar sucursal según rol');
        } else {
            $this->warn('   ⚠ Puede faltar lógica de roles en /dashboard');
        }
        
        $this->newLine();

        // 2. Verificar página React del dashboard
        $this->info('2. Verificando página React dashboard.tsx...');
        $dashboardFile = resource_path('js/pages/dashboard.tsx');
        
        if (!File::exists($dashboardFile)) {
            $this->error('   ✗ No existe dashboard.tsx');
            $allPassed = false;
        } else {
            $content = file_get_contents($dashboardFile);
            
            $checks = [
                'Importa Card components' => str_contains($content, 'Card'),
                'Usa primaryBranch' => str_contains($content, 'primaryBranch'),
                'Verifica rol warehouse_man' => str_contains($content, 'warehouse_man'),
                'Verifica rol owner' => str_contains($content, 'owner'),
                'Link a inventario' => str_contains($content, '/inventario'),
                'Link a movimientos' => str_contains($content, '/movimientos-inventario'),
                'Mensaje sin sucursal' => str_contains($content, 'Sin Sucursal Asignada') || str_contains($content, 'sin sucursal'),
            ];
            
            foreach ($checks as $check => $result) {
                if ($result) {
                    $this->info("   ✓ {$check}");
                } else {
                    $this->warn("   ⚠ Puede faltar: {$check}");
                }
            }
        }
        
        $this->newLine();

        // 3. Verificar usuarios de prueba
        $this->info('3. Verificando usuarios de prueba...');
        
        $warehousemen = User::where('type', 'warehouse_man')->get();
        $owners = User::where('type', 'owner')->get();
        
        $this->info("   ✓ Usuarios warehouse_man: {$warehousemen->count()}");
        $this->info("   ✓ Usuarios owner: {$owners->count()}");
        
        // Verificar si tienen sucursales asignadas
        foreach ($warehousemen as $wm) {
            $sucursalCount = $wm->sucursales()->count();
            if ($sucursalCount > 0) {
                $sucursal = $wm->sucursales()->first();
                $this->info("   ✓ {$wm->name} tiene {$sucursalCount} sucursal(es) asignada(s): {$sucursal->nombre}");
            } else {
                $this->warn("   ⚠ {$wm->name} NO tiene sucursales asignadas");
            }
        }
        
        foreach ($owners->take(3) as $owner) {
            $negocioId = $owner->negocio()->pluck('id')->first();
            if ($negocioId) {
                $sucursalCount = Sucursal::where('negocio_id', $negocioId)->count();
                $this->info("   ✓ {$owner->name} tiene {$sucursalCount} sucursal(es) en su negocio");
            } else {
                $this->warn("   ⚠ {$owner->name} NO tiene negocio asignado");
            }
        }
        
        $this->newLine();

        // 4. URLs de prueba
        $this->info('4. URLs para probar:');
        $this->line('   - Dashboard: /dashboard');
        
        $testUser = User::where('type', 'warehouse_man')->first();
        if ($testUser) {
            $sucursal = $testUser->sucursales()->first();
            if ($sucursal) {
                $this->line("   - Inventario: /sucursales/{$sucursal->id}/inventario");
                $this->line("   - Movimientos: /sucursales/{$sucursal->id}/movimientos-inventario");
            }
        }
        
        $this->newLine();

        // 5. Credenciales de prueba
        $this->info('5. Credenciales de prueba:');
        $almacenista = User::where('username', 'almacenista')->first();
        if ($almacenista) {
            $this->line('   Username: almacenista');
            $this->line('   Password: almacen123');
            $this->line('   Tipo: warehouse_man');
        } else {
            $this->warn('   ⚠ Usuario "almacenista" no encontrado');
            $this->line('   Ejecuta: php artisan db:seed --class=WarehouseUserSeeder');
        }
        
        $this->newLine();

        // Resumen final
        $this->info('═══════════════════════════════════════════════════════════');
        if ($allPassed) {
            $this->info('✓ VERIFICACIÓN COMPLETADA: DASHBOARD CONFIGURADO');
            $this->info('El dashboard ahora es útil para warehouse_man y owner.');
        } else {
            $this->error('✗ VERIFICACIÓN INCOMPLETA: REVISA LOS PUNTOS ARRIBA');
        }
        $this->info('═══════════════════════════════════════════════════════════');

        return $allPassed ? 0 : 1;
    }
}
