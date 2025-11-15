<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Revertir product_base_branch para usar branch_id en lugar de sucursal_id
     * Esto alinea la nomenclatura con el estándar del sistema.
     */
    public function up(): void
    {
        $table = 'product_base_branch';
        
        if (!Schema::hasTable($table)) {
            return;
        }

        // Si ya tiene branch_id, no hacer nada
        if (Schema::hasColumn($table, 'branch_id')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            // MySQL: renombrar columna directamente
            Schema::table($table, function (Blueprint $table) {
                $table->renameColumn('sucursal_id', 'branch_id');
            });
        } else {
            // SQLite: recrear tabla
            Schema::create($table.'_new', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_base_id')->constrained('product_bases')->onDelete('cascade');
                $table->foreignId('branch_id')->constrained('sucursales')->onDelete('cascade');
                $table->decimal('price', 12, 2)->default(0);
                $table->unsignedInteger('stock')->default(0);
                $table->timestamps();
                
                $table->unique(['product_base_id', 'branch_id']);
            });

            DB::statement("
                INSERT INTO {$table}_new (id, product_base_id, branch_id, price, stock, created_at, updated_at)
                SELECT id, product_base_id, sucursal_id, price, stock, created_at, updated_at
                FROM {$table}
            ");

            Schema::drop($table);
            Schema::rename($table.'_new', $table);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $table = 'product_base_branch';
        
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'branch_id')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            Schema::table($table, function (Blueprint $table) {
                $table->renameColumn('branch_id', 'sucursal_id');
            });
        } else {
            Schema::create($table.'_old', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_base_id')->constrained('product_bases')->onDelete('cascade');
                $table->foreignId('sucursal_id')->constrained('sucursales')->onDelete('cascade');
                $table->decimal('price', 12, 2)->default(0);
                $table->unsignedInteger('stock')->default(0);
                $table->timestamps();
                
                $table->unique(['product_base_id', 'sucursal_id']);
            });

            DB::statement("
                INSERT INTO {$table}_old (id, product_base_id, sucursal_id, price, stock, created_at, updated_at)
                SELECT id, product_base_id, branch_id, price, stock, created_at, updated_at
                FROM {$table}
            ");

            Schema::drop($table);
            Schema::rename($table.'_old', $table);
        }
    }
};
