<?php

namespace App\Console\Commands;

use App\Jobs\OnboardProductBaseBranch;
use App\Models\ProductBase;
use App\Models\Sucursal;
use Illuminate\Console\Command;

class ProductBaseBranchOnboard extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'nomada:pivot:onboard
        {--sucursales=* : IDs de sucursales (vacío = todas)}
        {--products=* : IDs de product_bases (vacío = todos activos)}
        {--strategy=flat : flat|percent|import}
        {--value=0 : valor base de la estrategia}
        {--dry-run : solo mostrar acciones sin ejecutar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Genera pivotes price/stock por sucursal desde catálogo maestro (solo super_admin)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Iniciando onboarding masivo de productos por sucursal...');
        $this->newLine();

        // Obtener sucursales
        $sucursalIds = $this->option('sucursales');
        if (empty($sucursalIds)) {
            $sucursalIds = Sucursal::query()->pluck('id')->all();
            $this->info('📍 Sucursales: TODAS (' . count($sucursalIds) . ')');
        } else {
            $this->info('📍 Sucursales: ' . implode(', ', $sucursalIds));
        }

        // Obtener productos
        $productIds = $this->option('products');
        if (empty($productIds)) {
            $productIds = ProductBase::query()
                ->where('is_active', 1)
                ->whereNull('deleted_at')
                ->pluck('id')
                ->all();
            $this->info('📦 Productos: TODOS ACTIVOS (' . count($productIds) . ')');
        } else {
            $this->info('📦 Productos: ' . implode(', ', $productIds));
        }

        // Estrategia
        $strategy = $this->option('strategy');
        $value = (float) $this->option('value');
        $this->info('💰 Estrategia: ' . $strategy . ' (valor: ' . $value . ')');
        $this->newLine();

        // Calcular total de operaciones
        $totalOperations = count($sucursalIds) * count($productIds);
        $this->info('📊 Total de operaciones potenciales: ' . $totalOperations);
        $this->newLine();

        // Dry run
        if ($this->option('dry-run')) {
            $this->warn('⚠️  DRY-RUN MODE: No se ejecutarán cambios');
            $this->newLine();
            
            $this->table(
                ['Parámetro', 'Valor'],
                [
                    ['Sucursales', count($sucursalIds)],
                    ['Productos', count($productIds)],
                    ['Estrategia', $strategy],
                    ['Valor', $value],
                    ['Operaciones', $totalOperations],
                ]
            );

            return self::SUCCESS;
        }

        // Confirmación
        if (!$this->confirm('¿Deseas continuar con el onboarding?', true)) {
            $this->error('❌ Operación cancelada');
            return self::FAILURE;
        }

        // Dispatch job
        $this->info('🔄 Lanzando job en cola...');
        OnboardProductBaseBranch::dispatch($sucursalIds, $productIds, $strategy, $value);
        
        $this->newLine();
        $this->info('✅ Job lanzado exitosamente: OnboardProductBaseBranch');
        $this->info('💡 Monitorea el progreso con: php artisan queue:work');
        
        return self::SUCCESS;
    }
}
