<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClienteDireccion extends Model
{
    protected $table = 'cliente_direcciones';

    protected $fillable = [
        'negocio_cliente_id',
        'direccion_completa',
        'codigo_postal',
        'referencias',
    ];

    public function negocioCliente()
    {
        return $this->belongsTo(NegocioCliente::class);
    }
}
