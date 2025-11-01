<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Negocio extends Model
{
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
}
