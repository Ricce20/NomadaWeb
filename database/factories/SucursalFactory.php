<?php

namespace Database\Factories;

use App\Models\Negocio;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Sucursal>
 */
class SucursalFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre' => fake()->company() . ' - ' . fake()->city(),
            'direccion_completa' => fake()->address(),
            'telefono' => fake()->phoneNumber(),
            'codigo_postal' => fake()->postcode(),
            'activo' => true,
            'negocio_id' => Negocio::factory(),
            'horarios' => [
                'lunes' => ['hora_apertura' => '09:00', 'hora_cierre' => '18:00', 'cerrado' => false],
                'martes' => ['hora_apertura' => '09:00', 'hora_cierre' => '18:00', 'cerrado' => false],
                'miercoles' => ['hora_apertura' => '09:00', 'hora_cierre' => '18:00', 'cerrado' => false],
                'jueves' => ['hora_apertura' => '09:00', 'hora_cierre' => '18:00', 'cerrado' => false],
                'viernes' => ['hora_apertura' => '09:00', 'hora_cierre' => '18:00', 'cerrado' => false],
                'sabado' => ['hora_apertura' => '09:00', 'hora_cierre' => '14:00', 'cerrado' => false],
                'domingo' => ['cerrado' => true],
            ],
        ];
    }
}
