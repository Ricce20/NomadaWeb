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
        'branch_id',
        'price',
        'stock',
        'sale_type',
    ];

    protected $casts = [
        'price' => 'decimal:2', // JSON devolverá "120.00" (string) por diseño de Laravel
        'stock' => 'integer',
        'product_base_id' => 'integer',
        'branch_id' => 'integer',
    ];

    public function productBase()
    {
        return $this->belongsTo(ProductBase::class, 'product_base_id');
    }

    public function branch()
    {
        return $this->belongsTo(Sucursal::class, 'branch_id');
    }
    
    // Alias para compatibilidad
    public function sucursal()
    {
        return $this->branch();
    }
}
