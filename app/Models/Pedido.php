<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pedido extends Model
{
    protected $table = 'pedidos';

    protected $fillable = [
        'folio',
        'cliente_id',
        'user_id',
        'sucursal_id',
        'direccion_entrega',
        'latitud',
        'longitud',
        'requiere_envio',
        'distancia_km',
        'duracion_minutos',
        'costo_envio',
        'subtotal',
        'total',
        'monto_adelanto',
        'pago_completo',
        'saldo_pendiente',
        'notas_pago',
        'estado_pago',
        'estado',
        'fecha_pedido',
        'fecha_entrega',
        'fecha_cancelacion',
        'motivo_cancelacion',
        'created_by',
        'cancelado_por'
    ];

    protected $casts = [
        'requiere_envio' => 'boolean',
        'pago_completo' => 'boolean',
        'latitud' => 'decimal:7',
        'longitud' => 'decimal:7',
        'distancia_km' => 'decimal:2',
        'costo_envio' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'total' => 'decimal:2',
        'monto_adelanto' => 'decimal:2',
        'saldo_pendiente' => 'decimal:2',
    ];

    public function cliente()
    {
        return $this->belongsTo(NegocioCliente::class);
    }
    public function creador()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function detalles()
    {
        return $this->hasMany(PedidoDetalle::class);
    }
    public function statusHistories()
    {
        return $this->hasMany(PedidoEstadoHistorial::class);
    }
    public function clienteUser()
    {
        return $this->belongsTo(User::class);
    }

    public function sucursal()
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function estadoViaje()
    {
        return $this->hasMany(ViajePedido::class);
    }

}
