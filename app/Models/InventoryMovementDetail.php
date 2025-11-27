<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryMovementDetail extends Model
{
    protected $table = 'inventory_movement_details';

    protected $fillable = [
        'inventory_movement_id',
        'product_base_branch_id',
        'quantity',
        'previous_stock',
        'new_stock',
        'notes',
    ];
    
    protected $casts = [
        'quantity' => 'decimal:4',
        'previous_stock' => 'decimal:4',
        'new_stock' => 'decimal:4',
    ];

    public function movement()
    {
        return $this->belongsTo(InventoryMovement::class);
    }

    public function productBaseBranch()
    {
        return $this->belongsTo(ProductBaseBranch::class);
    }
}
