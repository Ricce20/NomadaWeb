<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sucursal extends Model
{
    use HasFactory, SoftDeletes;

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
        'image_url'
    ];

    protected $casts = [
        'horarios' => 'array',
        'activo' => 'boolean',
        'latitud' => 'decimal:7',
        'longitud' => 'decimal:7',
    ];

    public function negocio(): BelongsTo
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

    public function empleados(): BelongsToMany
    {
        return $this->belongsToMany(Empleado::class, 'sucursal_empleados')
            ->withPivot(['id', 'activo', 'started_at', 'ended_at', 'changed_by'])
            ->withTimestamps();
    }

    public function productos(): HasMany
    {
        return $this->hasMany(ProductBaseBranch::class, 'branch_id');
    }
}
