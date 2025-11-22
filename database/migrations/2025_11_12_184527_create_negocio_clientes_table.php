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
        Schema::create('negocio_clientes', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('apellidos');
            $table->string('codigo_cliente')->unique()->nullable();
            $table->string('telefono',12)->unique();
            $table->unsignedBigInteger('negocio_id');
            $table->date('fecha_registro');
            $table->boolean('activo')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('negocio_id')->references('id')->on('negocios')->onDelete('cascade')->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('negocio_clientes');
    }
};
