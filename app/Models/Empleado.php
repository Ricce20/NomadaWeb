<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Empleado extends Model
{
    use SoftDeletes;
    protected $table = 'empleados';

    protected $fillable = [
        'nombre',
        'apellidos',
        'edad',
        'telefono',
        'activo',
        'negocio_id',
        'sucursal_id'
    ];

    public function negocio(){
        return $this->belongsTo(Negocio::class);
    }

    public function sucursales()
    {
        // toda la historia
        return $this->belongsToMany(Sucursal::class);
    }
}
