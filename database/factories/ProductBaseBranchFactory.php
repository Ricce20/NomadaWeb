<?php

namespace Database\Factories;

use App\Models\ProductBase;
use App\Models\Sucursal;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductBaseBranch>
 */
class ProductBaseBranchFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_base_id' => ProductBase::factory(),
            'sucursal_id' => Sucursal::factory(),
            'price' => fake()->randomFloat(2, 10, 1000),
            'stock' => fake()->numberBetween(0, 100),
        ];
    }
}
