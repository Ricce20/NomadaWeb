<?php

namespace Tests\Feature\Management;

use App\Models\User;
use App\Models\ProductBase;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Unit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductBaseCrudSmokeTest extends TestCase
{
    use RefreshDatabase;

    protected $brand;
    protected $category;
    protected $unit;
    protected $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->seed();
        
        $this->brand = Brand::firstOrCreate(['slug' => 'test-brand'], ['name' => 'Test Brand']);
        $this->category = Category::firstOrCreate(['slug' => 'test-category'], ['name' => 'Test Category']);
        $this->unit = Unit::firstOrCreate(['abbreviation' => 'pz'], ['name' => 'Pieza']);
        
        $this->superAdmin = User::where('email', 'test@example.com')->first();
        
        if (!$this->superAdmin) {
            $this->markTestSkipped('Super admin user not seeded');
        }
    }

    public function test_super_admin_can_create_a_product_base()
    {
        $data = [
            'sku_base' => 'TEST-' . uniqid(),
            'name' => 'Test Product',
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
            'tax_code' => 'IVA16',
            'is_active' => true,
            'specs_json' => ['color' => 'rojo', 'peso' => '1kg'],
            'barcodes' => ['7501234567890'],
        ];

        $response = $this->actingAs($this->superAdmin)
            ->post('/management/product-bases', $data);

        $response->assertStatus(302);
        $response->assertRedirect('/management/product-bases');
        $response->assertSessionHas('ok', 'Producto creado');

        $this->assertDatabaseHas('product_bases', [
            'sku_base' => $data['sku_base'],
            'name' => $data['name'],
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
            'is_active' => true,
        ]);
    }

    public function test_super_admin_can_update_a_product_base()
    {
        $product = ProductBase::create([
            'sku_base' => 'TEST-UPDATE-' . uniqid(),
            'name' => 'Original Name',
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
            'is_active' => true,
        ]);

        $updateData = [
            'sku_base' => $product->sku_base,
            'name' => 'Updated Name',
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
            'is_active' => false,
        ];

        $response = $this->actingAs($this->superAdmin)
            ->put("/management/product-bases/{$product->id}", $updateData);

        $response->assertStatus(302);
        $response->assertSessionHas('ok', 'Producto actualizado');

        $this->assertDatabaseHas('product_bases', [
            'id' => $product->id,
            'name' => 'Updated Name',
            'is_active' => false,
        ]);
    }

    public function test_super_admin_can_soft_delete_a_product_base()
    {
        $product = ProductBase::create([
            'sku_base' => 'TEST-DELETE-' . uniqid(),
            'name' => 'Product to Delete',
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->delete("/management/product-bases/{$product->id}");

        $response->assertStatus(302);
        $response->assertRedirect('/management/product-bases');
        $response->assertSessionHas('ok', 'Producto eliminado');

        // Verificar soft delete
        $this->assertSoftDeleted('product_bases', [
            'id' => $product->id,
        ]);

        // Verificar que deleted_at no es null
        $deletedProduct = ProductBase::withTrashed()->find($product->id);
        $this->assertNotNull($deletedProduct->deleted_at);
    }

    public function test_super_admin_can_view_edit_page()
    {
        $product = ProductBase::create([
            'sku_base' => 'TEST-EDIT-' . uniqid(),
            'name' => 'Product to Edit',
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->get("/management/product-bases/{$product->id}/edit");

        $response->assertStatus(200);
    }

    public function test_owner_cannot_create_a_product_base()
    {
        $owner = User::where('email', 'eduardo@example.com')->first();
        
        if (!$owner) {
            $this->markTestSkipped('Owner user not seeded');
        }

        $data = [
            'sku_base' => 'TEST-OWNER-' . uniqid(),
            'name' => 'Test Product by Owner',
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
            'is_active' => true,
        ];

        $response = $this->actingAs($owner)
            ->post('/management/product-bases', $data);

        $response->assertStatus(403);

        $this->assertDatabaseMissing('product_bases', [
            'sku_base' => $data['sku_base'],
        ]);
    }

    public function test_validation_fails_when_sku_base_is_missing()
    {
        $data = [
            'name' => 'Test Product',
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
            'is_active' => true,
        ];

        $response = $this->actingAs($this->superAdmin)
            ->post('/management/product-bases', $data);

        $response->assertStatus(302);
        $response->assertSessionHasErrors('sku_base');
    }

    public function test_validation_fails_when_sku_base_is_duplicated()
    {
        $existingSku = 'TEST-DUPLICATE-' . uniqid();
        
        ProductBase::create([
            'sku_base' => $existingSku,
            'name' => 'Existing Product',
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
            'is_active' => true,
        ]);

        $data = [
            'sku_base' => $existingSku,
            'name' => 'Duplicate Product',
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'uom_id' => $this->unit->id,
            'is_active' => true,
        ];

        $response = $this->actingAs($this->superAdmin)
            ->post('/management/product-bases', $data);

        $response->assertStatus(302);
        $response->assertSessionHasErrors('sku_base');
    }
}
