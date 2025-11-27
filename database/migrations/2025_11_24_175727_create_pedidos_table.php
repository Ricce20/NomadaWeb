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
        Schema::create('pedidos', function (Blueprint $table) {
            $table->id();
            // Básicos
            $table->string('folio')->unique();
            $table->foreignId('cliente_id')->constrained('negocio_clientes')->nullable()->onDelete('restrict');
            $table->foreignId('user_id')->constrained('users')->nullable()->onDelete('restrict');//pedido en linea o por cliente
            $table->foreignId('sucursal_id')->constrained('sucursales')->onDelete('restrict');
            
            // Dirección de entrega
            $table->text('direccion_entrega')->nullable();
            $table->decimal('latitud', 10, 7)->nullable();
            $table->decimal('longitud', 10, 7)->nullable();
            
            // Datos de transporte/envío
            $table->boolean('requiere_envio')->default(false);
            $table->decimal('distancia_km', 8, 2)->nullable();
            $table->integer('duracion_minutos')->nullable();
            $table->decimal('costo_envio', 10, 2)->default(0);
            
            // Totales
            $table->decimal('subtotal', 10, 2);
            $table->decimal('total', 10, 2);
            
            // Datos de pago
            $table->decimal('monto_adelanto', 10, 2)->default(0);
            $table->boolean('pago_completo')->default(false);
            $table->decimal('saldo_pendiente', 10, 2)->default(0);
            $table->text('notas_pago')->nullable();
            $table->enum('estado_pago', ['pendiente', 'adelanto', 'pagado'])->default('pendiente');
            
            // Estados del pedido
            $table->enum('estado', [
                'pendiente',
                'confirmado',
                'en_preparacion',
                'en_ruta',
                'entregado',
                'cancelado'
            ])->default('pendiente');
            
            // Fechas importantes
            $table->timestamp('fecha_pedido')->useCurrent();
            $table->timestamp('fecha_entrega')->nullable();
            $table->timestamp('fecha_cancelacion')->nullable();
            
            // Cancelación
            $table->text('motivo_cancelacion')->nullable();
            $table->foreignId('cancelado_por')->nullable()->constrained('users');
            
            // Auditoría
            $table->foreignId('created_by')->nullable()->constrained('users');
            
            
            // Índices
            $table->index('folio');
            $table->index('cliente_id');
            $table->index('sucursal_id');
            $table->index('estado');
            $table->index('estado_pago');
            $table->index('fecha_pedido');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pedidos');
    }
};
