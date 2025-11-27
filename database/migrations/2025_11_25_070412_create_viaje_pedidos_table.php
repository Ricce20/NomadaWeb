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
        Schema::create('viaje_pedidos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->constrained('pedidos')->onDelete('cascade');
            $table->foreignId('vehiculo_id')->constrained('vehiculos')->onDelete('cascade');
            $table->enum('estado', ['asignado', 'en_ruta', 'entregado', 'cancelado'])->default('asignado');
            $table->timestamp('fecha_asignacion')->nullable();
            $table->timestamp('fecha_salida')->nullable();
            $table->timestamp('fecha_entrega')->nullable();
            $table->foreignId('conductor_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->index('estado');
            $table->index('conductor_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('viaje_pedidos');
    }
};
