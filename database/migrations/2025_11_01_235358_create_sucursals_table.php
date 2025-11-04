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
        Schema::create('sucursales', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->unique();
            $table->string('direccion_completa');
            $table->string('telefono',15)->unique();
            $table->boolean('activo')->default(true);
            $table->json('horarios');
            $table->string('codigo_postal',5);
            $table->decimal('latitud', 10, 7)->nullable();
            $table->decimal('longitud', 10, 7)->nullable();
            $table->unsignedBigInteger('negocio_id');
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
        Schema::dropIfExists('sucursales');
    }
};
