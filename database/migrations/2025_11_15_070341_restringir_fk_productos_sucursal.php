<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Cambiar FK de product_base_branch a RESTRICT en lugar de CASCADE
     * Esto evita que se eliminen productos del catálogo que están en uso por sucursales
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver === 'sqlite') {
            // SQLite no soporta ALTER CONSTRAINT, skip
            return;
        }

        if ($driver === 'mysql') {
            $database = DB::getDatabaseName();
            
            // Obtener el nombre de la FK existente
            $fkName = DB::selectOne("
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = ?
                  AND TABLE_NAME = 'product_base_branch'
                  AND COLUMN_NAME = 'product_base_id'
                  AND REFERENCED_TABLE_NAME = 'product_bases'
            ", [$database]);
            
            if ($fkName) {
                // Eliminar FK existente
                DB::statement("ALTER TABLE product_base_branch DROP FOREIGN KEY `{$fkName->CONSTRAINT_NAME}`");
                
                // Crear nueva FK con RESTRICT
                DB::statement("
                    ALTER TABLE product_base_branch 
                    ADD CONSTRAINT `{$fkName->CONSTRAINT_NAME}` 
                    FOREIGN KEY (product_base_id) 
                    REFERENCES product_bases(id) 
                    ON DELETE RESTRICT
                ");
            }
        }
    }

    /**
     * Revertir a CASCADE
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver === 'sqlite') {
            return;
        }

        if ($driver === 'mysql') {
            $database = DB::getDatabaseName();
            
            $fkName = DB::selectOne("
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = ?
                  AND TABLE_NAME = 'product_base_branch'
                  AND COLUMN_NAME = 'product_base_id'
                  AND REFERENCED_TABLE_NAME = 'product_bases'
            ", [$database]);
            
            if ($fkName) {
                DB::statement("ALTER TABLE product_base_branch DROP FOREIGN KEY `{$fkName->CONSTRAINT_NAME}`");
                
                DB::statement("
                    ALTER TABLE product_base_branch 
                    ADD CONSTRAINT `{$fkName->CONSTRAINT_NAME}` 
                    FOREIGN KEY (product_base_id) 
                    REFERENCES product_bases(id) 
                    ON DELETE CASCADE
                ");
            }
        }
    }
};
