<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        // Asegurar que la tabla existe
        if (!Schema::hasTable('product_base_branch')) {
            return;
        }

        if ($driver === 'sqlite') {
            // SQLite: no ALTER FK. Solo garantizamos el índice único.
            // CREATE UNIQUE INDEX IF NOT EXISTS es válido en SQLite.
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS pbb_product_branch_unique ON product_base_branch (product_base_id, branch_id)');
            return;
        }

        if ($driver === 'mysql') {
            $database = DB::getDatabaseName();

            // UNIQUE: sólo crear si no existe
            $hasUnique = DB::table('information_schema.STATISTICS')
                ->where('TABLE_SCHEMA', $database)
                ->where('TABLE_NAME', 'product_base_branch')
                ->where('INDEX_NAME', 'pbb_product_branch_unique')
                ->exists();

            if (!$hasUnique) {
                DB::statement('ALTER TABLE product_base_branch ADD UNIQUE INDEX pbb_product_branch_unique (product_base_id, branch_id)');
            }

            // FK branch_id → branches.id con CASCADE: sólo crear si no existe
            $hasFk = DB::table('information_schema.KEY_COLUMN_USAGE as k')
                ->join('information_schema.REFERENTIAL_CONSTRAINTS as r', function ($join) use ($database) {
                    $join->on('k.CONSTRAINT_NAME', '=', 'r.CONSTRAINT_NAME')
                        ->on('k.CONSTRAINT_SCHEMA', '=', 'r.CONSTRAINT_SCHEMA');
                })
                ->where('k.CONSTRAINT_SCHEMA', $database)
                ->where('k.TABLE_NAME', 'product_base_branch')
                ->where('k.COLUMN_NAME', 'branch_id')
                ->where('k.REFERENCED_TABLE_NAME', 'branches')
                ->exists();

            if (!$hasFk) {
                // Si hubiese alguna FK previa con otro nombre, la intentamos quitar de forma segura
                $existingFks = DB::select("
                    SELECT CONSTRAINT_NAME
                    FROM information_schema.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'product_base_branch' AND COLUMN_NAME='branch_id' AND REFERENCED_TABLE_NAME IS NOT NULL
                ", [$database]);

                foreach ($existingFks as $fk) {
                    DB::statement("ALTER TABLE product_base_branch DROP FOREIGN KEY `{$fk->CONSTRAINT_NAME}`");
                }

                DB::statement('ALTER TABLE product_base_branch ADD CONSTRAINT pbb_branch_fk FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE');
            }
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if (!Schema::hasTable('product_base_branch')) {
            return;
        }

        if ($driver === 'sqlite') {
            // SQLite: podemos quitar el índice si existe (no es obligatorio para tests)
            // IGNORAMOS el drop si no está soportado; no es crítico para down.
            try {
                DB::statement('DROP INDEX IF EXISTS pbb_product_branch_unique');
            } catch (\Throwable $e) {
                // noop
            }
            return;
        }

        if ($driver === 'mysql') {
            $database = DB::getDatabaseName();

            // Quitar FK si existe
            $existingFks = DB::select("
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'product_base_branch' AND COLUMN_NAME='branch_id' AND REFERENCED_TABLE_NAME IS NOT NULL
            ", [$database]);

            foreach ($existingFks as $fk) {
                DB::statement("ALTER TABLE product_base_branch DROP FOREIGN KEY `{$fk->CONSTRAINT_NAME}`");
            }

            // Quitar UNIQUE si existe
            $hasUnique = DB::table('information_schema.STATISTICS')
                ->where('TABLE_SCHEMA', $database)
                ->where('TABLE_NAME', 'product_base_branch')
                ->where('INDEX_NAME', 'pbb_product_branch_unique')
                ->exists();

            if ($hasUnique) {
                DB::statement('ALTER TABLE product_base_branch DROP INDEX pbb_product_branch_unique');
            }
        }
    }
};