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
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE product_bases MODIFY COLUMN approval_status ENUM('approved', 'pending', 'rejected', 'local') DEFAULT 'approved'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE product_bases MODIFY COLUMN approval_status ENUM('approved', 'pending', 'rejected') DEFAULT 'approved'");
    }
};
