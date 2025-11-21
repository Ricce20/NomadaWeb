<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Sucursal;

class SetupWarehouseUser extends Command
{
    protected $signature = 'warehouse:setup-user {email?}';
    protected $description = 'Configura y verifica un usuario warehouse_man';

    public function handle()
    {
        $this->info('═══════════════════════════════════════════════════════════');
        $this->info('CONFIGURACIÓN DE USUARIO WAREHOUSE_MAN');
        $this->info('═══════════════════════════════════════════════════════════');
        $this->newLine();

        // Buscar usuario
        $email = $this->argument('email') ?? $this->ask('Email del usuario warehouse_man', 'eduardo@example.com');
        
        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("✗ No se encontró usuario con email: {$email}");
            return Command::FAILURE;
        }

        $this->info("✓ Usuario encontrado: {$user->name}");
        $this->line("  Email: {$user->email}");
        $this->line("  Tipo: {$user->type}");
        $this->newLine();

        // Verificar tipo
        if ($user->type !== User::TYPE_WAREHOUSEMAN) {
            $this->warn("⚠ El usuario NO es warehouse_man (es: {$user->type})");
            
            if ($this->confirm('¿Cambiar tipo a warehouse_man?')) {
                $user->type = User::TYPE_WAREHOUSEMAN;
                $user->save();
                $this->info("✓ Tipo cambiado a warehouse_man");
            }
        }

        // Verificar sucursales asignadas
        $this->newLine();
        $this->info('Verificando sucursales asignadas...');
        
        $sucursales = $user->sucursales;
        
        if ($sucursales->isEmpty()) {
            $this->warn('✗ El usuario NO tiene sucursales asignadas');
            $this->newLine();
            
            // Buscar sucursales disponibles
            $allSucursales = Sucursal::all();
            
            if ($allSucursales->isEmpty()) {
                $this->error('No hay sucursales en el sistema');
                return Command::FAILURE;
            }

            $this->info('Sucursales disponibles:');
            foreach ($allSucursales as $s) {
                $this->line("  {$s->id}. {$s->nombre}");
            }
            $this->newLine();

            $sucursalId = $this->ask('ID de la sucursal a asignar', $allSucursales->first()->id);
            $sucursal = Sucursal::find($sucursalId);

            if ($sucursal) {
                $user->sucursales()->attach($sucursal->id);
                $this->info("✓ Usuario asignado a: {$sucursal->nombre}");
            }
        } else {
            $this->info("✓ Sucursales asignadas: {$sucursales->count()}");
            foreach ($sucursales as $s) {
                $this->line("  • {$s->nombre} (ID: {$s->id})");
            }
        }

        // Mostrar URL de acceso
        $this->newLine();
        $this->info('═══════════════════════════════════════════════════════════');
        $this->info('INFORMACIÓN DE ACCESO');
        $this->info('═══════════════════════════════════════════════════════════');
        
        $firstSucursal = $user->sucursales()->first();
        
        if ($firstSucursal) {
            $this->info("Dashboard de inventario:");
            $this->line("  /sucursales/{$firstSucursal->id}/inventario");
            $this->newLine();
            $this->info("Credenciales:");
            $this->line("  Email: {$user->email}");
            $this->line("  Password: (la que configuraste)");
        } else {
            $this->warn('El usuario necesita estar asignado a una sucursal');
        }

        $this->newLine();

        return Command::SUCCESS;
    }
}
