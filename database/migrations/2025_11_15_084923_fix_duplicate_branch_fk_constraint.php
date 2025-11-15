<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Eliminar FK duplicada que apunta a 'branches' (tabla vacía)
     * Mantener solo la FK que apunta a 'sucursales' (tabla correcta)
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver !== 'mysql') {
            return; // Solo para MySQL
        }

        $database = DB::getDatabaseName();
        
        // Verificar si existe la FK incorrecta que apunta a 'branches'
        $fkExists = DB::selectOne("
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME = 'product_base_branch'
              AND COLUMN_NAME = 'branch_id'
              AND REFERENCED_TABLE_NAME = 'branches'
            LIMIT 1
        ", [$database]);
        
        if ($fkExists) {
            // Eliminar la FK incorrecta
            DB::statement("ALTER TABLE product_base_branch DROP FOREIGN KEY `{$fkExists->CONSTRAINT_NAME}`");
            
            echo "FK incorrecta eliminada: {$fkExists->CONSTRAINT_NAME}\n";
        }
        
        // Verificar que existe la FK correcta a 'sucursales'
        $correctFkExists = DB::selectOne("
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME = 'product_base_branch'
              AND COLUMN_NAME = 'branch_id'
              AND REFERENCED_TABLE_NAME = 'sucursales'
            LIMIT 1
        ", [$database]);
        
        if (!$correctFkExists) {
            // Crear la FK correcta si no existe
            DB::statement("
                ALTER TABLE product_base_branch 
                ADD CONSTRAINT fk_pbb_sucursal 
                FOREIGN KEY (branch_id) 
                REFERENCES sucursales(id) 
                ON DELETE CASCADE
            ");
            
            echo "FK correcta creada: fk_pbb_sucursal\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No revertir - la FK a 'branches' era incorrecta
        // Mantener solo la FK a 'sucursales'
    }
};
