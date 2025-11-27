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
        Schema::create('inventory_movement_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_movement_id')->constrained('inventory_movements')->onDelete('cascade')->onUpdate('cascade');
            $table->foreignId('product_base_branch_id')->constrained('product_base_branch')->onDelete('cascade')->onUpdate('cascade');
            $table->decimal('quantity', 15, 4); // Cantidad en unidad base
            $table->decimal('previous_stock', 15, 4); // Stock antes del movimiento
            $table->decimal('new_stock', 15, 4); // Stock después del movimiento
            $table->text('notes')->nullable();


            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_movement_details');
    }
};
