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
        Schema::table('product_bases', function (Blueprint $table) {
            if (!Schema::hasColumn('product_bases', 'sku_base')) {
                $table->string('sku_base', 64)->nullable()->unique()->after('id');
            }
            if (!Schema::hasColumn('product_bases', 'tax_code')) {
                $table->string('tax_code', 32)->nullable()->after('name');
            }
            if (!Schema::hasColumn('product_bases', 'specs_json')) {
                $table->json('specs_json')->nullable()->after('tax_code');
            }
            if (!Schema::hasColumn('product_bases', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('specs_json');
            }
            
            // Renombrar unit_id a uom_id si existe unit_id
            if (Schema::hasColumn('product_bases', 'unit_id') && !Schema::hasColumn('product_bases', 'uom_id')) {
                $table->renameColumn('unit_id', 'uom_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_bases', function (Blueprint $table) {
            if (Schema::hasColumn('product_bases', 'sku_base')) {
                $table->dropUnique(['sku_base']);
                $table->dropColumn('sku_base');
            }
            if (Schema::hasColumn('product_bases', 'tax_code')) {
                $table->dropColumn('tax_code');
            }
            if (Schema::hasColumn('product_bases', 'specs_json')) {
                $table->dropColumn('specs_json');
            }
            if (Schema::hasColumn('product_bases', 'is_active')) {
                $table->dropColumn('is_active');
            }
            
            // Revertir renombre
            if (Schema::hasColumn('product_bases', 'uom_id') && !Schema::hasColumn('product_bases', 'unit_id')) {
                $table->renameColumn('uom_id', 'unit_id');
            }
        });
    }
};
