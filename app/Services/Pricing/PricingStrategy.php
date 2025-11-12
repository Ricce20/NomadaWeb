<?php

namespace App\Services\Pricing;

use App\Models\ProductBase;

class PricingStrategy
{
    /**
     * Factory method para crear estrategia
     */
    public static function make(string $name, float $value): self
    {
        return new self($name, $value);
    }

    /**
     * Constructor
     */
    public function __construct(
        private string $name,
        private float $value
    ) {}

    /**
     * Calcular precio para un producto según la estrategia
     */
    public function priceFor(ProductBase $product): float
    {
        // Intentar obtener precio base de specs_json o usar 0
        $basePrice = data_get($product, 'specs_json.base_price', 0) ?: 0;

        return match ($this->name) {
            // Precio plano: base + valor
            'flat' => max(0, $basePrice + $this->value),
            
            // Porcentaje: base * (1 + valor/100)
            // Ejemplo: base=100, value=10 → 100 * 1.10 = 110
            'percent' => max(0, $basePrice * (1 + $this->value / 100)),
            
            // Import: usar valor directo (placeholder para CSV futuro)
            'import' => max(0, $this->value),
            
            // Default: usar precio base
            default => max(0, $basePrice),
        };
    }

    /**
     * Obtener nombre de la estrategia
     */
    public function getName(): string
    {
        return $this->name;
    }

    /**
     * Obtener valor de la estrategia
     */
    public function getValue(): float
    {
        return $this->value;
    }

    /**
     * Descripción de la estrategia
     */
    public function description(): string
    {
        return match ($this->name) {
            'flat' => "Precio base + {$this->value}",
            'percent' => "Precio base + {$this->value}%",
            'import' => "Precio fijo: {$this->value}",
            default => "Precio base sin modificación",
        };
    }
}
