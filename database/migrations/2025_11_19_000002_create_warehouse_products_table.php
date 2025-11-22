<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('warehouse_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('product_base_branch_id')->constrained('product_base_branch')->onDelete('cascade');
            $table->integer('stock')->default(0);
            $table->integer('min_stock')->nullable();
            $table->timestamps();
            
            $table->unique(['warehouse_id', 'product_base_branch_id']);
            $table->index('warehouse_id');
            $table->index('product_base_branch_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warehouse_products');
    }
};
