<?php

namespace App\Jobs;

use App\Models\ProductBase;
use App\Models\ProductBaseBranch;
use App\Models\Sucursal;
use App\Services\Pricing\PricingStrategy;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class OnboardProductBaseBranch implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public array $sucursalIds,
        public array $productIds,
        public string $strategy,
        public float $value
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('OnboardProductBaseBranch: Iniciando', [
            'sucursales' => count($this->sucursalIds),
            'productos' => count($this->productIds),
            'strategy' => $this->strategy,
            'value' => $this->value,
        ]);

        $strategy = PricingStrategy::make($this->strategy, $this->value);

        // Obtener productos activos y no eliminados
        $products = ProductBase::whereIn('id', $this->productIds)
            ->where('is_active', 1)
            ->whereNull('deleted_at')
            ->get();

        // Obtener sucursales
        $sucursales = Sucursal::whereIn('id', $this->sucursalIds)->get();

        $created = 0;
        $skipped = 0;

        foreach ($sucursales as $sucursal) {
            foreach ($products as $product) {
                // Calcular precio según estrategia
                $price = $strategy->priceFor($product);

                // firstOrCreate respeta unicidad
                $pivot = ProductBaseBranch::firstOrCreate(
                    [
                        'product_base_id' => $product->id,
                        'sucursal_id' => $sucursal->id,
                    ],
                    [
                        'price' => $price,
                        'stock' => 0,
                    ]
                );

                if ($pivot->wasRecentlyCreated) {
                    $created++;
                    
                    Log::info('OnboardProductBaseBranch: Pivot creado', [
                        'sucursal_id' => $sucursal->id,
                        'sucursal_nombre' => $sucursal->nombre,
                        'product_base_id' => $product->id,
                        'product_name' => $product->name,
                        'price' => $price,
                        'strategy' => $this->strategy,
                    ]);
                } else {
                    $skipped++;
                }
            }
        }

        Log::info('OnboardProductBaseBranch: Completado', [
            'created' => $created,
            'skipped' => $skipped,
            'total' => $created + $skipped,
        ]);
    }
}
