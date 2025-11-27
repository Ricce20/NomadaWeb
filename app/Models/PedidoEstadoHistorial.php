<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PedidoEstadoHistorial extends Model
{
    protected $table = 'pedido_estado_historial';

    protected $fillable = [
        'pedido_id',
        'estado_anterior',
        'estado_nuevo',
        'notas',
    ];

    public function pedido()
    {
        return $this->belongsTo(Pedido::class);
    }
}
