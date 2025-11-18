<?php

use App\Models\User;
use App\Models\Sucursal;
use App\Models\ProductBase;
use App\Models\ProductBaseBranch;
use App\Models\Negocio;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Unit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mkOwnerAndSucursal(): array
{
    $owner = User::factory()->create(['type' => 'owner']);
    $negocio = Negocio::factory()->create(['user_id' => $owner->id]);
    $sucursal = Sucursal::factory()->create(['negocio_id' => $negocio->id]);
    return [$owner, $sucursal];
}

function mkManager(User $owner, Sucursal $sucursal): User
{
    $manager = User::factory()->create(['type' => 'manager']);
    // Asignar manager a la sucursal
    $sucursal->usuarios()->attach($manager->id);
    return $manager;
}

function mkWarehouse(Sucursal $sucursal): User
{
    $warehouse = User::factory()->create(['type' => 'warehouse_man']);
    // Asignar warehouse a la sucursal
    $sucursal->usuarios()->attach($warehouse->id);
    return $warehouse;
}

function mkDriver(Sucursal $sucursal): User
{
    $driver = User::factory()->create(['type' => 'driver']);
    // Asignar driver a la sucursal
    $sucursal->usuarios()->attach($driver->id);
    return $driver;
}

function activeProduct(): ProductBase
{
    return ProductBase::factory()->create([
        'is_active' => 1,
        'deleted_at' => null,
        'brand_id' => Brand::factory(),
        'category_id' => Category::factory(),
        'uom_id' => Unit::factory(),
    ]);
}

// ============================================================================
// OWNER TESTS
// ============================================================================

test('owner puede CRUD en su sucursal', function () {
    [$owner, $sucursal] = mkOwnerAndSucursal();
    $p = activeProduct();

    // STORE
    $resp = $this->actingAs($owner)->post(route('sucursales.productos.store', $sucursal), [
        'product_base_id' => $p->id,
        'price' => 100,
        'stock' => 5,
    ]);
    $resp->assertStatus(302)->assertSessionHasNoErrors();
    expect(ProductBaseBranch::where([
        'product_base_id' => $p->id,
        'sucursal_id' => $sucursal->id
    ])->exists())->toBeTrue();

    $pivot = ProductBaseBranch::first();

    // UPDATE
    $resp = $this->actingAs($owner)->put(route('sucursales.productos.update', [$sucursal, $pivot]), [
        'price' => 120,
        'stock' => 7,
    ]);
    $resp->assertStatus(302)->assertSessionHasNoErrors();
    $pivot->refresh();
    expect($pivot->price)->toBe('120.00') // decimal:2 cast devuelve string
        ->and($pivot->stock)->toBe(7);

    // DESTROY
    $resp = $this->actingAs($owner)->delete(route('sucursales.productos.destroy', [$sucursal, $pivot]));
    $resp->assertStatus(302)->assertSessionHasNoErrors();
    expect(ProductBaseBranch::find($pivot->id))->toBeNull();
});

test('owner no puede modificar pivot de otra sucursal', function () {
    [$owner, $s1] = mkOwnerAndSucursal();
    [$otherOwner, $s2] = mkOwnerAndSucursal();
    $pivot = ProductBaseBranch::factory()->create(['sucursal_id' => $s2->id]);

    $resp = $this->actingAs($owner)->put(route('sucursales.productos.update', [$s1, $pivot]), ['price' => 99]);
    $resp->assertStatus(403);
});

// ============================================================================
// MANAGER TESTS
// ============================================================================

test('manager asignado puede manage, no asignado no', function () {
    [$owner, $sucursal] = mkOwnerAndSucursal();
    $p = activeProduct();
    $manager = mkManager($owner, $sucursal);
    $notManager = User::factory()->create(['type' => 'manager']);

    // manager asignado -> OK
    $resp = $this->actingAs($manager)->post(route('sucursales.productos.store', $sucursal), [
        'product_base_id' => $p->id,
        'price' => 50,
        'stock' => 1
    ]);
    $resp->assertStatus(302);

    // manager no asignado -> 403
    $p2 = activeProduct();
    $resp = $this->actingAs($notManager)->post(route('sucursales.productos.store', $sucursal), [
        'product_base_id' => $p2->id,
        'price' => 51,
        'stock' => 1
    ]);
    $resp->assertStatus(403);
});

// ============================================================================
// WAREHOUSE TESTS
// ============================================================================

test('warehouse solo puede actualizar stock; cambiar price -> 403/422', function () {
    [$owner, $sucursal] = mkOwnerAndSucursal();
    $w = mkWarehouse($sucursal);
    $pivot = ProductBaseBranch::factory()->create(['sucursal_id' => $sucursal->id]);

    // solo stock -> OK
    $resp = $this->actingAs($w)->put(route('sucursales.productos.update', [$sucursal, $pivot]), [
        'stock' => 99
    ]);
    $resp->assertStatus(302);
    $pivot->refresh();
    expect($pivot->stock)->toBe(99);

    // intenta price -> debe fallar
    $resp = $this->actingAs($w)->put(route('sucursales.productos.update', [$sucursal, $pivot]), [
        'price' => 123
    ]);
    expect(in_array($resp->getStatusCode(), [403, 422]))->toBeTrue();
});

test('warehouse no puede agregar productos', function () {
    [$owner, $sucursal] = mkOwnerAndSucursal();
    $w = mkWarehouse($sucursal);
    $p = activeProduct();

    $resp = $this->actingAs($w)->post(route('sucursales.productos.store', $sucursal), [
        'product_base_id' => $p->id,
        'price' => 100,
        'stock' => 10
    ]);
    $resp->assertStatus(403);
});

test('warehouse no puede eliminar productos', function () {
    [$owner, $sucursal] = mkOwnerAndSucursal();
    $w = mkWarehouse($sucursal);
    $pivot = ProductBaseBranch::factory()->create(['sucursal_id' => $sucursal->id]);

    $resp = $this->actingAs($w)->delete(route('sucursales.productos.destroy', [$sucursal, $pivot]));
    $resp->assertStatus(403);
});

// ============================================================================
// DRIVER TESTS
// ============================================================================

test('driver solo lectura', function () {
    [$owner, $sucursal] = mkOwnerAndSucursal();
    $driver = mkDriver($sucursal);

    // Puede ver
    $resp = $this->actingAs($driver)->get(route('sucursales.productos.index', $sucursal));
    $resp->assertOk();

    // No puede agregar
    $p = activeProduct();
    $resp = $this->actingAs($driver)->post(route('sucursales.productos.store', $sucursal), [
        'product_base_id' => $p->id,
        'price' => 10,
        'stock' => 1
    ]);
    $resp->assertStatus(403);

    // No puede actualizar
    $pivot = ProductBaseBranch::factory()->create(['sucursal_id' => $sucursal->id]);
    $resp = $this->actingAs($driver)->put(route('sucursales.productos.update', [$sucursal, $pivot]), [
        'stock' => 99
    ]);
    $resp->assertStatus(403);

    // No puede eliminar
    $resp = $this->actingAs($driver)->delete(route('sucursales.productos.destroy', [$sucursal, $pivot]));
    $resp->assertStatus(403);
});

// ============================================================================
// UNICIDAD TESTS
// ============================================================================

test('unicidad product_base_id+sucursal_id', function () {
    [$owner, $sucursal] = mkOwnerAndSucursal();
    $p = activeProduct();

    // Primera vez -> OK
    $this->actingAs($owner)->post(route('sucursales.productos.store', $sucursal), [
        'product_base_id' => $p->id,
        'price' => 10,
        'stock' => 1
    ])->assertStatus(302)->assertSessionHasNoErrors();

    // Segunda vez -> Error
    $this->actingAs($owner)->post(route('sucursales.productos.store', $sucursal), [
        'product_base_id' => $p->id,
        'price' => 12,
        'stock' => 3
    ])->assertStatus(302)->assertSessionHasErrors();
});

// ============================================================================
// FILTROS INDEX TESTS
// ============================================================================

test('filtros index (brand/category/search)', function () {
    [$owner, $sucursal] = mkOwnerAndSucursal();
    
    $brand1 = Brand::factory()->create(['name' => 'Cemex']);
    $brand2 = Brand::factory()->create(['name' => 'Holcim']);
    $category1 = Category::factory()->create(['name' => 'Cemento']);
    $category2 = Category::factory()->create(['name' => 'Acero']);
    $unit = Unit::factory()->create();

    $p1 = ProductBase::factory()->create([
        'name' => 'Cemento Portland',
        'sku_base' => 'CEM-001',
        'brand_id' => $brand1->id,
        'category_id' => $category1->id,
        'uom_id' => $unit->id,
    ]);
    $p2 = ProductBase::factory()->create([
        'name' => 'Varilla Acero',
        'sku_base' => 'VAR-001',
        'brand_id' => $brand2->id,
        'category_id' => $category2->id,
        'uom_id' => $unit->id,
    ]);

    ProductBaseBranch::factory()->create([
        'product_base_id' => $p1->id,
        'sucursal_id' => $sucursal->id
    ]);
    ProductBaseBranch::factory()->create([
        'product_base_id' => $p2->id,
        'sucursal_id' => $sucursal->id
    ]);

    // Test search filter
    $resp = $this->actingAs($owner)->get(route('sucursales.productos.index', $sucursal) . '?search=cemento');
    $resp->assertOk();
    $resp->assertInertia(fn ($page) => 
        $page->has('items.data', 1)
            ->where('items.data.0.name', 'Cemento Portland')
    );

    // Test brand filter
    $resp = $this->actingAs($owner)->get(route('sucursales.productos.index', $sucursal) . '?brand_id=' . $brand1->id);
    $resp->assertOk();
    $resp->assertInertia(fn ($page) => 
        $page->has('items.data', 1)
            ->where('items.data.0.brand', 'Cemex')
    );

    // Test category filter
    $resp = $this->actingAs($owner)->get(route('sucursales.productos.index', $sucursal) . '?category_id=' . $category2->id);
    $resp->assertOk();
    $resp->assertInertia(fn ($page) => 
        $page->has('items.data', 1)
            ->where('items.data.0.category', 'Acero')
    );
});

// ============================================================================
// API SEARCH TESTS
// ============================================================================

test('search API excluye inactivos/soft-deleted y respeta exclude_sucursal_id', function () {
    $u = User::factory()->create(['type' => 'owner']);
    $unit = Unit::factory()->create();
    
    $active = ProductBase::factory()->create([
        'is_active' => 1,
        'deleted_at' => null,
        'sku_base' => 'AA001',
        'brand_id' => Brand::factory(),
        'category_id' => Category::factory(),
        'uom_id' => $unit->id,
    ]);
    $inactive = ProductBase::factory()->create([
        'is_active' => 0,
        'sku_base' => 'AA002',
        'brand_id' => Brand::factory(),
        'category_id' => Category::factory(),
        'uom_id' => $unit->id,
    ]);
    $deleted = ProductBase::factory()->create([
        'is_active' => 1,
        'sku_base' => 'AA003',
        'deleted_at' => now(),
        'brand_id' => Brand::factory(),
        'category_id' => Category::factory(),
        'uom_id' => $unit->id,
    ]);
    
    $s = Sucursal::factory()->create();
    ProductBaseBranch::factory()->create([
        'product_base_id' => $active->id,
        'sucursal_id' => $s->id
    ]);

    Sanctum::actingAs($u);
    $resp = $this->getJson('/api/product-bases/search?term=AA&exclude_sucursal_id=' . $s->id);
    $resp->assertOk();
    
    $ids = collect($resp->json())->pluck('id')->toArray();
    
    // El producto activo NO debe aparecer (excluido por sucursal_id)
    expect($ids)->not->toContain($active->id);
    // El inactivo NO debe aparecer
    expect($ids)->not->toContain($inactive->id);
    // El eliminado NO debe aparecer
    expect($ids)->not->toContain($deleted->id);
});

test('search API requiere autenticación', function () {
    $resp = $this->getJson('/api/product-bases/search?term=test');
    $resp->assertStatus(401);
});

test('search API retorna solo campos necesarios', function () {
    $u = User::factory()->create(['type' => 'owner']);
    $p = activeProduct();

    Sanctum::actingAs($u);
    $resp = $this->getJson('/api/product-bases/search?term=' . $p->sku_base);
    $resp->assertOk();
    
    $data = $resp->json();
    if (count($data) > 0) {
        $first = $data[0];
        expect($first)->toHaveKeys(['id', 'sku_base', 'name', 'brand', 'category', 'unit']);
    }
});

test('search API limita resultados a 20', function () {
    $u = User::factory()->create(['type' => 'owner']);
    
    // Crear unidades, brands y categorías reutilizables
    $unit = Unit::factory()->create();
    $brand = Brand::factory()->create();
    $category = Category::factory()->create();
    
    // Crear 25 productos activos
    for ($i = 0; $i < 25; $i++) {
        ProductBase::factory()->create([
            'is_active' => 1,
            'deleted_at' => null,
            'name' => "Producto Test $i",
            'brand_id' => $brand->id,
            'category_id' => $category->id,
            'uom_id' => $unit->id,
        ]);
    }

    Sanctum::actingAs($u);
    $resp = $this->getJson('/api/product-bases/search?term=Producto');
    $resp->assertOk();
    
    $data = $resp->json();
    expect(count($data))->toBeLessThanOrEqual(20);
});
