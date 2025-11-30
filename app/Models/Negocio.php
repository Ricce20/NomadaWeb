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
        'logo'
    ];
    protected $appends = ['logo_url'];

    public function getLogoUrlAttribute()
    {
        return $this->logo 
            ? asset('storage/' . $this->logo) 
            : null;
    }
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
