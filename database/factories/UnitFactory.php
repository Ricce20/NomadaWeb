<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Unit>
 */
class UnitFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $units = [
            ['name' => 'Pieza', 'abbreviation' => 'pz'],
            ['name' => 'Kilogramo', 'abbreviation' => 'kg'],
            ['name' => 'Litro', 'abbreviation' => 'L'],
            ['name' => 'Metro', 'abbreviation' => 'm'],
            ['name' => 'Caja', 'abbreviation' => 'caja'],
        ];

        $unit = fake()->randomElement($units);

        return [
            'name' => $unit['name'],
            'abbreviation' => $unit['abbreviation'],
        ];
    }
}
