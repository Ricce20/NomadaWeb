<?php

namespace Tests\Feature\Management;

use App\Models\User;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Unit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductBaseAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected $brand;
    protected $category;
    protected $unit;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->seed();
        
        $this->brand = Brand::firstOrCreate(['slug' => 'test-brand'], ['name' => 'Test Brand']);
        $this->category = Category::firstOrCreate(['slug' => 'test-category'], ['name' => 'Test Category']);
        $this->unit = Unit::firstOrCreate(['abbreviation' => 'pz'], ['name' => 'Pieza']);
    }

    public function test_super_admin_can_access_management_product_bases_index()
    {
        $user = User::where('email', 'test@example.com')->first();
        
        if (!$user) {
            $this->markTestSkipped('Super admin user not seeded');
        }

        $response = $this->actingAs($user)->get('/management/product-bases');

        $response->assertStatus(200);
    }

    public function test_owner_cannot_access_management_product_bases_index()
    {
        $user = User::where('email', 'eduardo@example.com')->first();
        
        if (!$user) {
            $this->markTestSkipped('Owner user not seeded');
        }

        $response = $this->actingAs($user)->get('/management/product-bases');

        $response->assertStatus(403);
    }

    public function test_manager_cannot_access_management_product_bases_index()
    {
        $user = User::where('email', 'employee@example.com')->first();
        
        if (!$user) {
            $this->markTestSkipped('Manager user not seeded');
        }

        $response = $this->actingAs($user)->get('/management/product-bases');

        $response->assertStatus(403);
    }

    public function test_guest_is_redirected_to_login_when_accessing_management_product_bases()
    {
        $response = $this->get('/management/product-bases');

        $response->assertStatus(302);
        $response->assertRedirect('/login');
    }

    public function test_super_admin_can_access_create_page()
    {
        $user = User::where('email', 'test@example.com')->first();
        
        if (!$user) {
            $this->markTestSkipped('Super admin user not seeded');
        }

        $response = $this->actingAs($user)->get('/management/product-bases/create');

        $response->assertStatus(200);
    }

    public function test_owner_cannot_access_create_page()
    {
        $user = User::where('email', 'eduardo@example.com')->first();
        
        if (!$user) {
            $this->markTestSkipped('Owner user not seeded');
        }

        $response = $this->actingAs($user)->get('/management/product-bases/create');

        $response->assertStatus(403);
    }
}
