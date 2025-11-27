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
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('almacen_id')->constrained('almacenes')->onDelete('cascade')->onUpdate('cascade');
            $table->foreignId('sucursal_id')->constrained('sucursales')->onDelete('cascade');
            $table->string('movement_number')->unique(); // Número único de movimiento
            $table->enum('type',['in','out','adjust']); // 'in', 'out', 'adjust'
            // $table->integer('quantity');
            // $table->integer('previous_stock')->nullable();
            // $table->integer('new_stock')->nullable();
            $table->text('reason')->nullable();
            $table->enum('status', ['pendiente', 'completado', 'cancelado'])->default('pendiente');
            $table->foreignId('performed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            $table->index('almacen_id');
            $table->index('sucursal_id');
            $table->index('type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
