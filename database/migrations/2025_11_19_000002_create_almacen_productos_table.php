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
        Schema::create('almacen_productos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('almacen_id')->constrained('almacenes')->onDelete('cascade')->onUpdate('cascade');
            $table->foreignId('product_base_branch_id')->constrained('product_base_branch')->onDelete('cascade');
            $table->integer('stock')->default(0);
            $table->timestamps();
            
            $table->unique(['almacen_id', 'product_base_branch_id']);
            $table->index('almacen_id');
            $table->index('product_base_branch_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('almacen_productos');
    }
};
