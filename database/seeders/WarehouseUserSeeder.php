<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Sucursal;
use Illuminate\Support\Facades\Hash;

class WarehouseUserSeeder extends Seeder
{
    /**
     * Crea un usuario warehouse_man (almacenista) para el owner eduardo@example.com
     * 
     * Uso: php artisan db:seed --class=WarehouseUserSeeder
     */
    public function run(): void
    {
        $this->command->info('═══════════════════════════════════════════════════════════');
        $this->command->info('CREANDO USUARIO WAREHOUSE_MAN (ALMACENISTA)');
        $this->command->info('═══════════════════════════════════════════════════════════');
        $this->command->newLine();

        // 1. Buscar el owner
        $owner = User::where('email', 'eduardo@example.com')
            ->where('type', User::TYPE_OWNER)
            ->first();

        if (!$owner) {
            $this->command->error('✗ No se encontró el usuario owner eduardo@example.com');
            return;
        }

        $this->command->info("✓ Owner encontrado: {$owner->name}");

        // 2. Obtener la sucursal del owner
        $negocio = $owner->negocio()->first();
        if (!$negocio) {
            $this->command->error('✗ El owner no tiene negocio');
            return;
        }

        $sucursal = $negocio->sucursales()->first();
        if (!$sucursal) {
            $this->command->error('✗ El negocio no tiene sucursales');
            return;
        }

        $this->command->info("✓ Sucursal: {$sucursal->nombre} (ID: {$sucursal->id})");
        $this->command->newLine();

        // 3. Verificar si ya existe el usuario
        $existingUser = User::where('username', 'almacenista')->first();
        
        if ($existingUser) {
            $this->command->warn('⚠ Ya existe un usuario con username: almacenista');
            $this->command->info('Actualizando usuario existente...');
            
            $existingUser->update([
                'name' => 'Juan Almacenista',
                'type' => User::TYPE_WAREHOUSEMAN,
                'password' => Hash::make('almacen123'),
            ]);

            $user = $existingUser;
            $this->command->info('✓ Usuario actualizado');
        } else {
            // 4. Crear el usuario warehouse_man
            $user = User::create([
                'name' => 'Juan Almacenista',
                'email' => 'almacenista@example.com',
                'password' => Hash::make('almacen123'),
                'username' => 'almacenista',
                'type' => User::TYPE_WAREHOUSEMAN,
                'phone' => '1234567890',
            ]);

            $this->command->info('✓ Usuario creado: Juan Almacenista');
        }

        // 5. Asignar a la sucursal
        if (!$user->sucursales()->where('sucursales.id', $sucursal->id)->exists()) {
            $user->sucursales()->attach($sucursal->id);
            $this->command->info("✓ Usuario asignado a sucursal: {$sucursal->nombre}");
        } else {
            $this->command->info("→ Usuario ya estaba asignado a la sucursal");
        }

        // 6. Resumen
        $this->command->newLine();
        $this->command->info('═══════════════════════════════════════════════════════════');
        $this->command->info('USUARIO WAREHOUSE_MAN CREADO EXITOSAMENTE');
        $this->command->info('═══════════════════════════════════════════════════════════');
        $this->command->newLine();
        
        $this->command->line('Información del usuario:');
        $this->command->line("  Nombre: {$user->name}");
        $this->command->line("  Username: {$user->username}");
        $this->command->line("  Email: {$user->email}");
        $this->command->line("  Password: almacen123");
        $this->command->line("  Tipo: warehouse_man (almacenista)");
        $this->command->line("  Sucursal: {$sucursal->nombre}");
        $this->command->newLine();
        
        $this->command->info('Para iniciar sesión:');
        $this->command->line("  1. Ve a /login");
        $this->command->line("  2. Username: almacenista");
        $this->command->line("  3. Password: almacen123");
        $this->command->newLine();
        
        $this->command->info('Dashboard de inventario:');
        $this->command->line("  /sucursales/{$sucursal->id}/inventario");
        $this->command->newLine();
        
        $this->command->info('El owner eduardo@example.com puede administrar este usuario desde:');
        $this->command->line("  Panel de usuarios de la sucursal");
        $this->command->newLine();
    }
}
