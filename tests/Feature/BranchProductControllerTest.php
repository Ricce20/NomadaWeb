<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Negocio;
use App\Models\ProductBase;
use App\Models\ProductBaseBranch;
use App\Models\Sucursal;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BranchProductControllerTest extends TestCase
{
    use RefreshDatabase;

    protected Brand $brand;
    protected Category $category;
    protected Unit $unit;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear datos base necesarios
        $this->brand = Brand::factory()->create();
        $this->category = Category::factory()->create();
        $this->unit = Unit::factory()->create();
    }

    // ============================================================================
    // AUTORIZACIÓN - Owner
    // ============================================================================

    public function test_owner_can_view_products_in_their_sucursal(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        $sucursal = Sucursal::factory()->create(['negocio_id' => $negocio->id]);

        $response = $this->actingAs($owner)->get(route('sucursales.productos.index', $sucursal));

        $response->assertOk();
    }

    public function test_owner_can_add_product_to_their_sucursal(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        $sucursal = Sucursal::factory()->create(['negocio_id' => $negocio->id]);
        $product = ProductBase::factory()->create([
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
        ]);

        $response = $this->actingAs($owner)->post(route('sucursales.productos.store', $sucursal), [
            'product_base_id' => $product->id,
            'price' => 100.50,
            'stock' => 10,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('product_base_branch', [
            'product_base_id' => $product->id,
            'sucursal_id' => $sucursal->id,
            'price' => 100.50,
            'stock' => 10,
        ]);
    }

    public function test_owner_can_update_product_price_in_their_sucursal(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        $sucursal = Sucursal::factory()->create(['negocio_id' => $negocio->id]);
        $product = ProductBase::factory()->create([
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
        ]);
        $pivot = ProductBaseBranch::factory()->create([
            'product_base_id' => $product->id,
            'sucursal_id' => $sucursal->id,
            'price' => 100,
            'stock' => 10,
        ]);

        $response = $this->actingAs($owner)->put(route('sucursales.productos.update', [$sucursal, $pivot]), [
            'price' => 150.00,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('product_base_branch', [
            'id' => $pivot->id,
            'price' => 150.00,
        ]);
    }

    public function test_owner_can_delete_product_from_their_sucursal(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        $sucursal = Sucursal::factory()->create(['negocio_id' => $negocio->id]);
        $product = ProductBase::factory()->create([
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
        ]);
        $pivot = ProductBaseBranch::factory()->create([
            'product_base_id' => $product->id,
            'sucursal_id' => $sucursal->id,
        ]);

        $response = $this->actingAs($owner)->delete(route('sucursales.productos.destroy', [$sucursal, $pivot]));

        $response->assertRedirect();
        $this->assertDatabaseMissing('product_base_branch', [
            'id' => $pivot->id,
        ]);
    }

    public function test_owner_cannot_access_products_from_another_negocio_sucursal(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        
        // Sucursal de otro negocio
        $otherNegocio = Negocio::factory()->create();
        $otherSucursal = Sucursal::factory()->create(['negocio_id' => $otherNegocio->id]);

        $response = $this->actingAs($owner)->get(route('sucursales.productos.index', $otherSucursal));

        $response->assertForbidden();
    }

    public function test_owner_cannot_modify_pivot_from_another_sucursal(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        $sucursal = Sucursal::factory()->create(['negocio_id' => $negocio->id]);
        
        // Pivot de otra sucursal
        $otherSucursal = Sucursal::factory()->create();
        $product = ProductBase::factory()->create([
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
        ]);
        $otherPivot = ProductBaseBranch::factory()->create([
            'product_base_id' => $product->id,
            'sucursal_id' => $otherSucursal->id,
        ]);

        $response = $this->actingAs($owner)->put(route('sucursales.productos.update', [$sucursal, $otherPivot]), [
            'price' => 200,
        ]);

        $response->assertForbidden();
    }

    // ============================================================================
    // AUTORIZACIÓN - Manager
    // ============================================================================

    public function test_manager_can_manage_products_in_assigned_sucursal(): void
    {
        $manager = User::factory()->create(['type' => 'manager']);
        $sucursal = Sucursal::factory()->create();
        
        // Asignar manager a la sucursal
        $sucursal->usuarios()->attach($manager->id);

        $response = $this->actingAs($manager)->get(route('sucursales.productos.index', $sucursal));

        $response->assertOk();
    }

    public function test_manager_cannot_access_non_assigned_sucursal(): void
    {
        $manager = User::factory()->create(['type' => 'manager']);
        $sucursal = Sucursal::factory()->create();
        // Manager NO asignado

        $response = $this->actingAs($manager)->get(route('sucursales.productos.index', $sucursal));

        $response->assertForbidden();
    }

    // ============================================================================
    // AUTORIZACIÓN - Super Admin
    // ============================================================================

    public function test_super_admin_can_access_any_sucursal(): void
    {
        $superAdmin = User::factory()->create(['type' => 'super_admin']);
        $sucursal = Sucursal::factory()->create();

        $response = $this->actingAs($superAdmin)->get(route('sucursales.productos.index', $sucursal));

        $response->assertOk();
    }

    // ============================================================================
    // AUTORIZACIÓN - Usuarios No Autorizados
    // ============================================================================

    public function test_warehouse_man_cannot_access_products(): void
    {
        $warehouseman = User::factory()->create(['type' => 'warehouse_man']);
        $sucursal = Sucursal::factory()->create();

        $response = $this->actingAs($warehouseman)->get(route('sucursales.productos.index', $sucursal));

        $response->assertForbidden();
    }

    public function test_driver_cannot_access_products(): void
    {
        $driver = User::factory()->create(['type' => 'driver']);
        $sucursal = Sucursal::factory()->create();

        $response = $this->actingAs($driver)->get(route('sucursales.productos.index', $sucursal));

        $response->assertForbidden();
    }

    // ============================================================================
    // UNICIDAD
    // ============================================================================

    public function test_cannot_add_same_product_twice_to_same_sucursal(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        $sucursal = Sucursal::factory()->create(['negocio_id' => $negocio->id]);
        $product = ProductBase::factory()->create([
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
        ]);

        // Primera vez - debe funcionar
        $this->actingAs($owner)->post(route('sucursales.productos.store', $sucursal), [
            'product_base_id' => $product->id,
            'price' => 100,
            'stock' => 10,
        ]);

        // Segunda vez - debe fallar
        $response = $this->actingAs($owner)->post(route('sucursales.productos.store', $sucursal), [
            'product_base_id' => $product->id,
            'price' => 200,
            'stock' => 20,
        ]);

        $response->assertSessionHasErrors('product_base_id');
        $response->assertStatus(302);
    }

    public function test_can_add_same_product_to_different_sucursales(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        $sucursal1 = Sucursal::factory()->create(['negocio_id' => $negocio->id]);
        $sucursal2 = Sucursal::factory()->create(['negocio_id' => $negocio->id]);
        $product = ProductBase::factory()->create([
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
        ]);

        // Agregar a sucursal 1
        $response1 = $this->actingAs($owner)->post(route('sucursales.productos.store', $sucursal1), [
            'product_base_id' => $product->id,
            'price' => 100,
            'stock' => 10,
        ]);

        // Agregar a sucursal 2
        $response2 = $this->actingAs($owner)->post(route('sucursales.productos.store', $sucursal2), [
            'product_base_id' => $product->id,
            'price' => 150,
            'stock' => 20,
        ]);

        $response1->assertRedirect();
        $response2->assertRedirect();
        
        $this->assertDatabaseCount('product_base_branch', 2);
    }

    // ============================================================================
    // CATÁLOGO ACTIVO
    // ============================================================================

    public function test_cannot_add_inactive_product(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        $sucursal = Sucursal::factory()->create(['negocio_id' => $negocio->id]);
        $product = ProductBase::factory()->inactive()->create([
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
        ]);

        $response = $this->actingAs($owner)->post(route('sucursales.productos.store', $sucursal), [
            'product_base_id' => $product->id,
            'price' => 100,
            'stock' => 10,
        ]);

        $response->assertSessionHasErrors('product_base_id');
    }

    public function test_cannot_add_soft_deleted_product(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        $sucursal = Sucursal::factory()->create(['negocio_id' => $negocio->id]);
        $product = ProductBase::factory()->trashed()->create([
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
        ]);

        $response = $this->actingAs($owner)->post(route('sucursales.productos.store', $sucursal), [
            'product_base_id' => $product->id,
            'price' => 100,
            'stock' => 10,
        ]);

        $response->assertSessionHasErrors('product_base_id');
    }

    // ============================================================================
    // FILTROS
    // ============================================================================

    public function test_search_filter_works(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        $sucursal = Sucursal::factory()->create(['negocio_id' => $negocio->id]);
        
        $product1 = ProductBase::factory()->create([
            'name' => 'Cemento Gris',
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
        ]);
        $product2 = ProductBase::factory()->create([
            'name' => 'Tornillo Acero',
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
        ]);
        
        ProductBaseBranch::factory()->create([
            'product_base_id' => $product1->id,
            'sucursal_id' => $sucursal->id,
        ]);
        ProductBaseBranch::factory()->create([
            'product_base_id' => $product2->id,
            'sucursal_id' => $sucursal->id,
        ]);

        $response = $this->actingAs($owner)->get(route('sucursales.productos.index', [
            'sucursal' => $sucursal,
            'search' => 'Cemento',
        ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('sucursales/productos/Index')
                ->has('items.data', 1)
                ->where('items.data.0.name', 'Cemento Gris')
        );
    }

    public function test_brand_filter_works(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        $sucursal = Sucursal::factory()->create(['negocio_id' => $negocio->id]);
        
        $brand1 = Brand::factory()->create(['name' => 'Marca A']);
        $brand2 = Brand::factory()->create(['name' => 'Marca B']);
        
        $product1 = ProductBase::factory()->create([
            'brand_id' => $brand1->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
        ]);
        $product2 = ProductBase::factory()->create([
            'brand_id' => $brand2->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
        ]);
        
        ProductBaseBranch::factory()->create([
            'product_base_id' => $product1->id,
            'sucursal_id' => $sucursal->id,
        ]);
        ProductBaseBranch::factory()->create([
            'product_base_id' => $product2->id,
            'sucursal_id' => $sucursal->id,
        ]);

        $response = $this->actingAs($owner)->get(route('sucursales.productos.index', [
            'sucursal' => $sucursal,
            'brand_id' => $brand1->id,
        ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('sucursales/productos/Index')
                ->has('items.data', 1)
                ->where('items.data.0.brand', 'Marca A')
        );
    }

    public function test_category_filter_works(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        $sucursal = Sucursal::factory()->create(['negocio_id' => $negocio->id]);
        
        $category1 = Category::factory()->create(['name' => 'Categoría A']);
        $category2 = Category::factory()->create(['name' => 'Categoría B']);
        
        $product1 = ProductBase::factory()->create([
            'brand_id' => $this->brand->id,
            'category_id' => $category1->id,
            'uom_id' => $this->unit->id,
        ]);
        $product2 = ProductBase::factory()->create([
            'brand_id' => $this->brand->id,
            'category_id' => $category2->id,
            'uom_id' => $this->unit->id,
        ]);
        
        ProductBaseBranch::factory()->create([
            'product_base_id' => $product1->id,
            'sucursal_id' => $sucursal->id,
        ]);
        ProductBaseBranch::factory()->create([
            'product_base_id' => $product2->id,
            'sucursal_id' => $sucursal->id,
        ]);

        $response = $this->actingAs($owner)->get(route('sucursales.productos.index', [
            'sucursal' => $sucursal,
            'category_id' => $category1->id,
        ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('sucursales/productos/Index')
                ->has('items.data', 1)
                ->where('items.data.0.category', 'Categoría A')
        );
    }

    // ============================================================================
    // VALIDACIONES
    // ============================================================================

    public function test_price_must_be_numeric_and_positive(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        $sucursal = Sucursal::factory()->create(['negocio_id' => $negocio->id]);
        $product = ProductBase::factory()->create([
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
        ]);

        $response = $this->actingAs($owner)->post(route('sucursales.productos.store', $sucursal), [
            'product_base_id' => $product->id,
            'price' => -10,
            'stock' => 10,
        ]);

        $response->assertSessionHasErrors('price');
    }

    public function test_stock_must_be_integer_and_positive(): void
    {
        $owner = User::factory()->create(['type' => 'owner']);
        $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
        $sucursal = Sucursal::factory()->create(['negocio_id' => $negocio->id]);
        $product = ProductBase::factory()->create([
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
        ]);

        $response = $this->actingAs($owner)->post(route('sucursales.productos.store', $sucursal), [
            'product_base_id' => $product->id,
            'price' => 100,
            'stock' => -5,
        ]);

        $response->assertSessionHasErrors('stock');
    }
}
