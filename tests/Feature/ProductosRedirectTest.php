<?php

namespace Tests\Feature;

use App\Models\Negocio;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductosRedirectTest extends TestCase
{
    use RefreshDatabase;

    public function test_singular_route_redirects_to_plural(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        $sucursal = Sucursal::factory()->create(['negocio_id' => $negocio->id]);

        $response = $this->actingAs($owner)->get("/sucursal/{$sucursal->id}/productos");

        $response->assertRedirect("/sucursales/{$sucursal->id}/productos");
    }

    public function test_plural_route_works_directly(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        $sucursal = Sucursal::factory()->create(['negocio_id' => $negocio->id]);

        $response = $this->actingAs($owner)->get("/sucursales/{$sucursal->id}/productos");

        $response->assertOk();
    }
}
