<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductBaseBranch extends Model
{
    use HasFactory;
    protected $table = 'product_base_branch';

    protected $fillable = [
        'product_base_id',
        'sucursal_id',
        'price',
        'stock',
    ];

    protected $casts = [
        'price' => 'decimal:2', // JSON devolverá "120.00" (string) por diseño de Laravel
        'stock' => 'integer',
        'product_base_id' => 'integer',
        'sucursal_id' => 'integer',
    ];

    public function productBase()
    {
        return $this->belongsTo(ProductBase::class, 'product_base_id');
    }

    public function sucursal()
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }
}
