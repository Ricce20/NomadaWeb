<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'abbreviation',
        'symbol',
        'description',
        'is_active',
    ];
    
    protected $casts = [
        'is_active' => 'boolean',
    ];
}