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
        Schema::create('cliente_direcciones', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('negocio_cliente_id');
            $table->string('direccion_completa');
            $table->string('referencia')->nullable();
            $table->string('codigo_postal')->nullable();
            $table->timestamps();

            $table->foreign('negocio_cliente_id')->references('id')->on('negocio_clientes')->onDelete('cascade')->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cliente_direccions');
    }
};
