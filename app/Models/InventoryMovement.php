<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'warehouse_id',
        'product_base_branch_id',
        'type',
        'quantity',
        'previous_stock',
        'new_stock',
        'reason',
        'performed_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'previous_stock' => 'integer',
        'new_stock' => 'integer',
        'warehouse_id' => 'integer',
        'product_base_branch_id' => 'integer',
        'performed_by' => 'integer',
    ];

    /**
     * Relación con el almacén
     */
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Relación con el producto por sucursal
     */
    public function productBaseBranch()
    {
        return $this->belongsTo(ProductBaseBranch::class, 'product_base_branch_id');
    }

    /**
     * Relación con el usuario que realizó el movimiento
     */
    public function performedBy()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
