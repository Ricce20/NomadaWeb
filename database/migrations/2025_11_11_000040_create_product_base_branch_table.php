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
        Schema::create('product_base_branch', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_base_id')->constrained('product_bases')->onDelete('cascade');
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->decimal('price', 10, 2);
            $table->integer('stock')->default(0);
            $table->timestamps();
            
            $table->unique(['product_base_id', 'branch_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_base_branch');
    }
};