<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agregar campo sale_type a product_base_branch
     * Define cómo se vende el producto en cada sucursal: por unidad, peso, longitud, volumen, etc.
     */
    public function up(): void
    {
        Schema::table('product_base_branch', function (Blueprint $table) {
            $table->string('sale_type', 20)->default('unit')->after('stock');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_base_branch', function (Blueprint $table) {
            $table->dropColumn('sale_type');
        });
    }
};
