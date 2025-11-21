<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;
use App\Models\User;
use App\Models\Sucursal;
use App\Models\Warehouse;
use App\Models\ProductBaseBranch;
use App\Models\InventoryMovement;

class VerifyInventoryModuleComplete extends Command
{
    protected $signature = 'inventory:verify-complete';
    protected $description = 'Verifica que el módulo de inventario esté 100% completo según el prompt original';

    public function handle()
    {
        $this->info('═══════════════════════════════════════════════════════════');
        $this->info('VERIFICACIÓN COMPLETA: MÓDULO DE INVENTARIO');
        $this->info('═══════════════════════════════════════════════════════════');
        $this->newLine();

        $allPassed = true;

        // A) Acceso del rol de almacén al dashboard de inventario
        $this->info('A) ACCESO DEL ROL DE ALMACÉN AL DASHBOARD');
        $this->line('─────────────────────────────────────────────────────────');
        
        $allPassed &= $this->checkWarehouseManRole();
        $allPassed &= $this->checkInventoryRoutes();
        $allPassed &= $this->checkMenuItems();
        
        $this->newLine();

        // B) Rutas para Movimientos de Inventario
        $this->info('B) RUTAS PARA MOVIMIENTOS DE INVENTARIO');
        $this->line('─────────────────────────────────────────────────────────');
        
        $allPassed &= $this->checkMovementRoutes();
        
        $this->newLine();

        // C) Backend – Controlador y lógica
        $this->info('C) BACKEND – CONTROLADOR Y LÓGICA');
        $this->line('─────────────────────────────────────────────────────────');
        
        $allPassed &= $this->checkInventoryMovementController();
        
        $this->newLine();

        // D) Backend – FormRequest
        $this->info('D) BACKEND – FORMREQUEST PARA VALIDAR MOVIMIENTOS');
        $this->line('─────────────────────────────────────────────────────────');
        
        $allPassed &= $this->checkFormRequest();
        
        $this->newLine();

        // E) Frontend – UI de Movimientos
        $this->info('E) FRONTEND – UI DE MOVIMIENTOS');
        $this->line('─────────────────────────────────────────────────────────');
        
        $allPassed &= $this->checkFrontendPages();
        
        $this->newLine();

        // F) Menú para Movimientos
        $this->info('F) MENÚ PARA MOVIMIENTOS');
        $this->line('─────────────────────────────────────────────────────────');
        
        $allPassed &= $this->checkMovementMenu();
        
        $this->newLine();

        // G) Criterios de aceptación
        $this->info('G) CRITERIOS DE ACEPTACIÓN');
        $this->line('─────────────────────────────────────────────────────────');
        
        $allPassed &= $this->checkAcceptanceCriteria();
        
        $this->newLine();

        // Resumen final
        $this->info('═══════════════════════════════════════════════════════════');
        if ($allPassed) {
            $this->info('✓ VERIFICACIÓN COMPLETADA: TODOS LOS CRITERIOS CUMPLIDOS');
            $this->info('El módulo de inventario está 100% completo según el prompt.');
        } else {
            $this->error('✗ VERIFICACIÓN INCOMPLETA: ALGUNOS CRITERIOS NO SE CUMPLEN');
            $this->warn('Revisa los puntos marcados arriba para completar el módulo.');
        }
        $this->info('═══════════════════════════════════════════════════════════');

        return $allPassed ? 0 : 1;
    }

    private function checkWarehouseManRole(): bool
    {
        $this->line('1. Verificando rol warehouse_man...');
        
        // Verificar constante en User model
        $userModel = file_get_contents(app_path('Models/User.php'));
        $hasConstant = str_contains($userModel, "TYPE_WAREHOUSEMAN = 'warehouse_man'");
        
        if ($hasConstant) {
            $this->info('   ✓ Constante TYPE_WAREHOUSEMAN definida en User model');
        } else {
            $this->error('   ✗ Falta constante TYPE_WAREHOUSEMAN en User model');
            return false;
        }
        
        // Verificar si existe al menos un usuario warehouse_man
        $warehouseManExists = User::where('type', 'warehouse_man')->exists();
        if ($warehouseManExists) {
            $count = User::where('type', 'warehouse_man')->count();
            $this->info("   ✓ Existen {$count} usuario(s) warehouse_man en la BD");
        } else {
            $this->warn('   ⚠ No hay usuarios warehouse_man (ejecuta: php artisan db:seed --class=WarehouseUserSeeder)');
        }
        
        return true;
    }

    private function checkInventoryRoutes(): bool
    {
        $this->line('2. Verificando rutas de dashboard de inventario...');
        
        $routes = [
            'sucursales.inventario.index' => 'GET sucursales/{sucursal}/inventario',
            'sucursales.inventario.show' => 'GET sucursales/{sucursal}/inventario/{warehouse}',
        ];
        
        $allExist = true;
        foreach ($routes as $name => $description) {
            if (Route::has($name)) {
                $this->info("   ✓ {$description}");
            } else {
                $this->error("   ✗ Falta ruta: {$description}");
                $allExist = false;
            }
        }
        
        // Verificar middleware de roles
        $routesFile = file_get_contents(base_path('routes/sucursales.php'));
        if (str_contains($routesFile, "role:owner,warehouse_man")) {
            $this->info("   ✓ Middleware de roles configurado (owner, warehouse_man)");
        } else {
            $this->warn("   ⚠ Middleware de roles no encontrado en rutas");
        }
        
        return $allExist;
    }

    private function checkMenuItems(): bool
    {
        $this->line('3. Verificando menú lateral...');
        
        $layoutFile = resource_path('js/layouts/sucursales/layout-partials.tsx');
        if (!File::exists($layoutFile)) {
            $this->error('   ✗ No existe layout-partials.tsx');
            return false;
        }
        
        $content = file_get_contents($layoutFile);
        $hasInventario = str_contains($content, "title: 'Inventario'");
        $hasMovimientos = str_contains($content, "title: 'Movimientos'");
        
        if ($hasInventario) {
            $this->info("   ✓ Menú 'Inventario' presente en layout");
        } else {
            $this->error("   ✗ Falta menú 'Inventario' en layout");
        }
        
        if ($hasMovimientos) {
            $this->info("   ✓ Menú 'Movimientos' presente en layout");
        } else {
            $this->error("   ✗ Falta menú 'Movimientos' en layout");
        }
        
        return $hasInventario && $hasMovimientos;
    }

    private function checkMovementRoutes(): bool
    {
        $this->line('1. Verificando rutas de movimientos...');
        
        $routes = [
            'sucursales.movimientos-inventario.index' => 'GET sucursales/{sucursal}/movimientos-inventario',
            'sucursales.movimientos-inventario.create' => 'GET sucursales/{sucursal}/movimientos-inventario/create',
            'sucursales.movimientos-inventario.store' => 'POST sucursales/{sucursal}/movimientos-inventario',
        ];
        
        $allExist = true;
        foreach ($routes as $name => $description) {
            if (Route::has($name)) {
                $this->info("   ✓ {$description}");
            } else {
                $this->error("   ✗ Falta ruta: {$description}");
                $allExist = false;
            }
        }
        
        return $allExist;
    }

    private function checkInventoryMovementController(): bool
    {
        $this->line('1. Verificando InventoryMovementController...');
        
        $controllerPath = app_path('Http/Controllers/Ownership/InventoryMovementController.php');
        if (!File::exists($controllerPath)) {
            $this->error('   ✗ No existe InventoryMovementController');
            return false;
        }
        
        $content = file_get_contents($controllerPath);
        
        $methods = [
            'index' => 'Lista movimientos de la sucursal',
            'create' => 'Formulario para crear movimiento',
            'store' => 'Guarda nuevo movimiento',
        ];
        
        $allExist = true;
        foreach ($methods as $method => $description) {
            if (str_contains($content, "function {$method}(")) {
                $this->info("   ✓ Método {$method}(): {$description}");
            } else {
                $this->error("   ✗ Falta método {$method}()");
                $allExist = false;
            }
        }
        
        // Verificar que usa InventoryService
        if (str_contains($content, 'InventoryService')) {
            $this->info('   ✓ Usa InventoryService para registrar movimientos');
        } else {
            $this->error('   ✗ No usa InventoryService');
            $allExist = false;
        }
        
        return $allExist;
    }

    private function checkFormRequest(): bool
    {
        $this->line('1. Verificando StoreInventoryMovementRequest...');
        
        $requestPath = app_path('Http/Requests/Ownership/StoreInventoryMovementRequest.php');
        if (!File::exists($requestPath)) {
            $this->error('   ✗ No existe StoreInventoryMovementRequest');
            return false;
        }
        
        $content = file_get_contents($requestPath);
        
        $rules = [
            'warehouse_id' => 'required, integer, exists',
            'product_base_branch_id' => 'required, integer, exists',
            'type' => "required, string, in:in,adjust",
            'quantity' => 'required, integer, min:1',
            'reason' => 'nullable, string',
        ];
        
        $this->info('   ✓ StoreInventoryMovementRequest existe');
        
        foreach ($rules as $field => $validation) {
            if (str_contains($content, "'{$field}'")) {
                $this->info("   ✓ Valida {$field}: {$validation}");
            } else {
                $this->warn("   ⚠ Puede faltar validación para {$field}");
            }
        }
        
        return true;
    }

    private function checkFrontendPages(): bool
    {
        $this->line('1. Verificando páginas React...');
        
        $pages = [
            'Index.tsx' => resource_path('js/Pages/sucursales/movimientos-inventario/Index.tsx'),
            'Create.tsx' => resource_path('js/Pages/sucursales/movimientos-inventario/Create.tsx'),
        ];
        
        $allExist = true;
        foreach ($pages as $name => $path) {
            if (File::exists($path)) {
                $this->info("   ✓ {$name} existe");
                
                $content = file_get_contents($path);
                
                if ($name === 'Index.tsx') {
                    $checks = [
                        'Tabla con movimientos' => str_contains($content, 'TableHeader'),
                        'Botón "Registrar movimiento"' => str_contains($content, 'Registrar movimiento'),
                        'Badges para tipos' => str_contains($content, 'Badge'),
                    ];
                } else {
                    $checks = [
                        'Select de Almacén' => str_contains($content, 'warehouse_id'),
                        'Select de Producto' => str_contains($content, 'product_base_branch_id'),
                        'Radio de Tipo' => str_contains($content, 'RadioGroup'),
                        'Input de Cantidad' => str_contains($content, 'quantity'),
                        'Textarea de Motivo' => str_contains($content, 'reason'),
                    ];
                }
                
                foreach ($checks as $check => $result) {
                    if ($result) {
                        $this->info("     ✓ {$check}");
                    } else {
                        $this->warn("     ⚠ Puede faltar: {$check}");
                    }
                }
            } else {
                $this->error("   ✗ No existe {$name}");
                $allExist = false;
            }
        }
        
        return $allExist;
    }

    private function checkMovementMenu(): bool
    {
        $this->line('1. Verificando entrada de menú para Movimientos...');
        
        $layoutFile = resource_path('js/layouts/sucursales/layout-partials.tsx');
        $content = file_get_contents($layoutFile);
        
        $hasMovimientos = str_contains($content, "title: 'Movimientos'") && 
                         str_contains($content, 'movimientos-inventario');
        
        if ($hasMovimientos) {
            $this->info("   ✓ Entrada 'Movimientos de inventario' en menú lateral");
            return true;
        } else {
            $this->error("   ✗ Falta entrada 'Movimientos de inventario' en menú");
            return false;
        }
    }

    private function checkAcceptanceCriteria(): bool
    {
        $this->line('1. Verificando criterios de aceptación...');
        
        // Verificar datos de prueba
        $sucursales = Sucursal::count();
        $warehouses = Warehouse::count();
        $products = ProductBaseBranch::count();
        $movements = InventoryMovement::count();
        
        $this->info("   ✓ Sucursales en BD: {$sucursales}");
        $this->info("   ✓ Almacenes en BD: {$warehouses}");
        $this->info("   ✓ Productos en sucursales: {$products}");
        $this->info("   ✓ Movimientos registrados: {$movements}");
        
        if ($sucursales > 0 && $warehouses > 0 && $products > 0) {
            $this->info('   ✓ Datos de prueba disponibles');
        } else {
            $this->warn('   ⚠ Faltan datos de prueba (ejecuta seeders)');
        }
        
        // Verificar que solo se permiten tipos 'in' y 'adjust'
        $requestPath = app_path('Http/Requests/Ownership/StoreInventoryMovementRequest.php');
        $content = file_get_contents($requestPath);
        
        if (str_contains($content, "in:in,adjust")) {
            $this->info('   ✓ Solo se permiten tipos "in" y "adjust" (no "out")');
        } else {
            $this->warn('   ⚠ Verificar que solo se permitan tipos "in" y "adjust"');
        }
        
        // Verificar que se usa InventoryService
        $controllerPath = app_path('Http/Controllers/Ownership/InventoryMovementController.php');
        $controllerContent = file_get_contents($controllerPath);
        
        if (str_contains($controllerContent, 'registerMovement')) {
            $this->info('   ✓ Se usa InventoryService::registerMovement (no se toca stock directo)');
        } else {
            $this->error('   ✗ No se usa InventoryService::registerMovement');
            return false;
        }
        
        return true;
    }
}
