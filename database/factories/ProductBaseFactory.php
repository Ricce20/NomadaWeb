<?php

namespace Database\Factories;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductBase>
 */
class ProductBaseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sku_base' => fake()->unique()->numerify('SKU-####'),
            'name' => fake()->words(3, true),
            'brand_id' => Brand::factory(),
            'category_id' => Category::factory(),
            'uom_id' => Unit::factory(),
            'is_active' => true,
            'tax_code' => fake()->randomElement(['IVA16', 'IVA8', 'EXENTO']),
            'specs_json' => null,
        ];
    }

    /**
     * Indicate that the product is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the product is soft deleted.
     */
    public function trashed(): static
    {
        return $this->state(fn (array $attributes) => [
            'deleted_at' => now(),
        ]);
    }
}
