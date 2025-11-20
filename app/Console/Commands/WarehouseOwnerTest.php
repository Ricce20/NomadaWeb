<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class WarehouseOwnerTest extends Command
{
    protected $signature = 'warehouse:owner-test';
    protected $description = 'Crea datos de prueba para el usuario owner (eduardo@example.com)';

    public function handle()
    {
        $this->info('╔════════════════════════════════════════════════════════════╗');
        $this->info('║  CREACIÓN DE DATOS DE PRUEBA PARA USUARIO OWNER           ║');
        $this->info('╚════════════════════════════════════════════════════════════╝');
        $this->newLine();

        // Ejecutar el seeder
        $this->info('Ejecutando seeder...');
        $this->newLine();

        Artisan::call('db:seed', [
            '--class' => 'WarehouseOwnerTestSeeder',
        ]);

        // Mostrar output del seeder
        $this->line(Artisan::output());

        return Command::SUCCESS;
    }
}
