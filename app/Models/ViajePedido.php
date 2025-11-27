<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ViajePedido extends Model
{
    protected $table = 'viaje_pedidos';

    protected $fillable = [
        'pedido_id',
        'vehiculo_id',
        'estado',
        'fecha_asignacion',
        'fecha_salida',
        'fecha_entrega',
        'conductor_id',
    ];

    public function pedido()
    {
        return $this->belongsTo(Pedido::class);
    }

    public function vehiculo()
    {
        return $this->belongsTo(Vehiculo::class);
    }

    public function conductor()
    {
        return $this->belongsTo(User::class, 'conductor_id');
    }
}
