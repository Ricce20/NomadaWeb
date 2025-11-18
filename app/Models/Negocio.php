<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Negocio extends Model
{
    use HasFactory, SoftDeletes;
    
    protected $fillable = [
        'nombre',
        'correo',
        'telefono',
        'activo',
        'descripcion',
        'user_id',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sucursales()
    {
        return $this->hasMany(Sucursal::class);
    }
}
