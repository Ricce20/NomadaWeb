<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agregar 'archived' al ENUM de approval_status en product_bases
     * 
     * Estados finales:
     * - 'approved': Producto corporativo aprobado (catálogo global)
     * - 'pending': Producto pendiente de aprobación
     * - 'rejected': Producto rechazado
     * - 'local': Producto local de sucursal (no aparece en catálogo global)
     * - 'archived': Producto archivado (estaba en uso, no se pudo eliminar)
     */
    public function up(): void
    {
        \Illuminate\Support\Facades\DB::statement(
            "ALTER TABLE product_bases MODIFY COLUMN approval_status ENUM('approved', 'pending', 'rejected', 'local', 'archived') DEFAULT 'approved'"
        );
    }

    /**
     * Revertir a estados anteriores (sin 'archived')
     */
    public function down(): void
    {
        // Primero, cambiar cualquier 'archived' a 'rejected' para no perder datos
        \Illuminate\Support\Facades\DB::statement(
            "UPDATE product_bases SET approval_status = 'rejected' WHERE approval_status = 'archived'"
        );
        
        \Illuminate\Support\Facades\DB::statement(
            "ALTER TABLE product_bases MODIFY COLUMN approval_status ENUM('approved', 'pending', 'rejected', 'local') DEFAULT 'approved'"
        );
    }
};
