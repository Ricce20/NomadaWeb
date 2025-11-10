<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sucursal extends Model
{
    use SoftDeletes;

    //
    protected $table = 'sucursales';
    protected $fillable = [
        'nombre',
        'direccion_completa',
        'telefono',
        'activo',
        'horarios',
        'codigo_postal',
        'latitud',
        'longitud',
        'negocio_id',
    ];

    protected $casts = [
        'horarios' => 'array',
        'activo' => 'boolean',
        'latitud' => 'decimal:7',
        'longitud' => 'decimal:7',
    ];

    public function negocio()
    {
        return $this->belongsTo(Negocio::class);
    }

     public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'sucursal_usuarios',
            'sucursal_id',
            'user_id'
        )->withTimestamps();
    }

    public function empleados()
    {
        return $this->belongsToMany(Empleado::class, 'sucursal_empleados')
                    ->withPivot(['id','activo','started_at','ended_at','changed_by'])
                    ->withTimestamps();
    }

}
