<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class NegocioCliente extends Model
{
    use softDeletes;

    protected $fillable = [
        'nombre',
        'apellidos',
        'codigo_cliente',
        'telefono',
        'negocio_id',
        'user_id',
        'fecha_registro',
        'activo'
    ];

    public function user(){
        return $this->belongsTo(User::class);
    }

    public function negocio(){
        return $this->belongsTo(Negocio::class);
    }
    public function direcciones_cliente()
    {
        return $this->hasMany(ClienteDireccion::class, 'negocio_cliente_id');
    }
    
}
