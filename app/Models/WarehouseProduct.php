<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WarehouseProduct extends Model
{
    use HasFactory;
    
    protected $table = "almacen_productos";

    protected $fillable = [
        'almacen_id',
        'product_base_branch_id',
        'stock',
        'min_stock',
    ];

    protected $casts = [
        'stock' => 'integer',
        'min_stock' => 'integer',
        'warehouse_id' => 'integer',
        'product_base_branch_id' => 'integer',
    ];

    /**
     * Relación con el almacén
     */
    public function warehouse()
    {
        return $this->belongsTo(Almacen::class,'almacen_id');
    }

    /**
     * Relación con el producto por sucursal
     */
    public function productBaseBranch()
    {
        return $this->belongsTo(ProductBaseBranch::class, 'product_base_branch_id');
    }
}
