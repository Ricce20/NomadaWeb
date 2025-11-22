<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'name',
        'description',
        'is_default',
        'status',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'branch_id' => 'integer',
    ];

    /**
     * Relación con la sucursal (Branch)
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Relación con los productos del almacén
     */
    public function warehouseProducts()
    {
        return $this->hasMany(WarehouseProduct::class);
    }

    /**
     * Relación con los movimientos de inventario
     */
    public function inventoryMovements()
    {
        return $this->hasMany(InventoryMovement::class);
    }
}
