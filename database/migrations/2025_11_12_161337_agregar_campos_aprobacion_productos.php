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
            $table->string('sku_base', 64)->nullable()->change();
            $table->enum('approval_status', ['approved', 'pending', 'rejected'])->default('approved')->after('is_active');
            $table->foreignId('origin_negocio_id')->nullable()->constrained('negocios')->nullOnDelete()->after('approval_status');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete()->after('origin_negocio_id');
            $table->timestamp('approved_at')->nullable()->after('created_by');
            $table->timestamp('rejected_at')->nullable()->after('approved_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_bases', function (Blueprint $table) {
            $table->dropColumn([
                'approval_status',
                'origin_negocio_id',
                'created_by',
                'approved_at',
                'rejected_at',
            ]);
        });
    }
};
