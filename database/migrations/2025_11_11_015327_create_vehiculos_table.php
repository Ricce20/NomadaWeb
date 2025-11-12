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
        Schema::create('vehiculos', function (Blueprint $table) {
            $table->id();
            $table->string('placa', 10)->unique();
            $table->string('marca', 50);
            $table->string('modelo', 50);
            $table->string('color', 30)->nullable();
            
            // Solo tipos de vehículos que pueden cargar cosas
            $table->enum('tipo', [
                'camioneta',
                'camion',
                'pickup',
                'furgoneta',
                'trailer',
                'van'
            ])->default('camioneta');
             // Nueva columna: capacidad de carga en kilogramos
            $table->decimal('capacidad_carga_kg', 8, 2)->nullable();
            
            $table->decimal('kilometros_por_litro', 5, 2)->nullable();
            $table->decimal('precio_litro_combustible', 6, 2)->nullable();
            $table->enum('estado', ['activo', 'mantenimiento', 'inactivo'])->default('activo');
            $table->unsignedBigInteger('sucursal_id');
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('sucursal_id')->references('id')->on('sucursales')->onDelete('cascade')->onUpdate('cascade');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('veiculos');
    }
};
