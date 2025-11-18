<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Database\Seeders\YeremiSuperAdminSeeder;
use Illuminate\Support\Str;
use App\Models\Negocio;
use App\Models\Sucursal;
class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        //user tipo super admin
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('test@example.com'),
                'email_verified_at' => now(),
                'type' => User::TYPE_SUPER_ADMIN,
            ]
        );

        //user tipo empleado(ya sea manager, warehouseman,etc)
        User::firstOrCreate(
            ['email' => 'employee@example.com'],
            [
                'name' => 'Test User employee',
                'username' => 'employee',
                'password' => Hash::make('employee@example.com'),
                'email_verified_at' => now(),
                'type' => User::TYPE_MANAGER,
            ]
        );

        // Usuario de pruebas: Eduardo Gomez (owner con negocio y sucursal)
        $eduardo = User::firstOrCreate(
            ['email' => 'eduardo@example.com'],
            [
                'name' => 'Eduardo Gomez',
                'username' => 'eduardo',
                'password' => Hash::make('eduardo@example.com'),
                'email_verified_at' => now(),
                'type' => User::TYPE_OWNER,
            ]
        );

        // Crear negocio para Eduardo si no existe
        $negocio = Negocio::firstOrCreate(
            [
                'user_id' => $eduardo->id,
                'nombre' => 'Negocio de Eduardo',
            ],
            [
                'correo' => 'contacto@negocio-eduardo.com',
                'telefono' => '5551112222',
                'activo' => true,
                'descripcion' => 'Negocio de pruebas de Eduardo',
            ]
        );

        // Crear sucursal principal si no existe
        Sucursal::firstOrCreate(
            [
                'negocio_id' => $negocio->id,
                'nombre' => $negocio->nombre . ' - Matriz',
            ],
            [
                'direccion_completa' => 'Calle Falsa 123, Ciudad',
                'telefono' => '5553334444',
                'horarios' => [
                    'lunes' => ['09:00', '18:00'],
                    'martes' => ['09:00', '18:00'],
                    'miercoles' => ['09:00', '18:00'],
                    'jueves' => ['09:00', '18:00'],
                    'viernes' => ['09:00', '18:00'],
                ],
                'codigo_postal' => '12345',
                'activo' => true,
            ]
        );

        // Empleados de prueba para el negocio de Eduardo
        User::firstOrCreate(
            ['email' => 'manager@eduardo.com'],
            [
                'name' => 'Eduardo Manager',
                'username' => 'manager_eduardo',
                'password' => Hash::make('manager@eduardo.com'),
                'email_verified_at' => now(),
                'type' => User::TYPE_MANAGER,
            ]
        );

        User::firstOrCreate(
            ['email' => 'warehouse@eduardo.com'],
            [
                'name' => 'Eduardo Warehouse',
                'username' => 'warehouse_eduardo',
                'password' => Hash::make('warehouse@eduardo.com'),
                'email_verified_at' => now(),
                'type' => User::TYPE_WAREHOUSEMAN,
            ]
        );

        User::firstOrCreate(
            ['email' => 'driver@eduardo.com'],
            [
                'name' => 'Eduardo Driver',
                'username' => 'driver_eduardo',
                'password' => Hash::make('driver@eduardo.com'),
                'email_verified_at' => now(),
                'type' => User::TYPE_DRIVER,
            ]
        );

        // Seeder de productos base de ferretería
        $this->call(FerreteriaProductBaseSeeder::class);
    }
}
