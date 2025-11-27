<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'almacen_id',
        'sucursal_id',
        'type',
        // 'quantity',
        // 'previous_stock',
        // 'new_stock',
        'reason',
        'performed_by',
        'status',
        'movement_number',
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
        return $this->belongsTo(Almacen::class,'almacen_id');
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

    public function details()
    {
        return $this->hasMany(InventoryMovementDetail::class);
    }

    // Generar número de movimiento automático
    public static function generateMovementNumber($type)
    {
        $prefix = match($type) {
            'entrada' => 'ENT',
            'salida' => 'SAL', 
            'ajuste' => 'AJT',
            'transferencia' => 'TRA',
            default => 'MOV'
        };

        $count = self::where('movement_type', $type)
            ->whereYear('created_at', now()->year)
            ->count() + 1;

        return $prefix . '-' . now()->format('Ymd') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
