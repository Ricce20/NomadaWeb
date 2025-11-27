<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductBaseBranch extends Model
{
    use HasFactory;
    protected $table = 'product_base_branch';

    // Tipos de venta permitidos
    public const SALE_TYPE_UNIT = 'unit';
    public const SALE_TYPE_WEIGHT = 'weight';
    public const SALE_TYPE_LENGTH = 'length';
    public const SALE_TYPE_VOLUME = 'volume';
    public const SALE_TYPE_AREA = 'area';

    public const SALE_TYPES = [
        self::SALE_TYPE_UNIT,
        self::SALE_TYPE_WEIGHT,
        self::SALE_TYPE_LENGTH,
        self::SALE_TYPE_VOLUME,
        self::SALE_TYPE_AREA,
    ];

    protected $fillable = [
        'product_base_id',
        'branch_id',
        'price',
        'stock',
        'sale_type',
        'image_path',
    ];

    protected $casts = [
        'price' => 'decimal:2', // JSON devolverá "120.00" (string) por diseño de Laravel
        'stock' => 'integer',
        'product_base_id' => 'integer',
        'branch_id' => 'integer',
        'sale_type' => 'string',
    ];
    // Agregar image_url automáticamente al serializar
    protected $appends = ['image_url'];

    /**
     * Accessor para obtener la URL completa de la imagen
     */
    public function getImageUrlAttribute()
    {
        return $this->image_path 
            ? asset('storage/' . $this->image_path) 
            : null;
    }
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

    /**
     * Relación con productos en almacenes
     */
    public function warehouseProducts()
    {
        return $this->hasMany(WarehouseProduct::class, 'product_base_branch_id');
    }

    /**
     * Recalcula el stock desde todos los almacenes y lo guarda.
     * Este método sincroniza ProductBaseBranch.stock como espejo
     * de la suma de warehouse_products.stock.
     */
    public function recalculateStockFromWarehouses(): void
    {
        $total = $this->warehouseProducts()->where('activo',true)->sum('stock');
        $this->stock = $total;
        $this->save();
    }

    /**
     * Accessor para obtener el stock total desde almacenes sin guardarlo.
     * Útil para comparaciones o verificaciones.
     */
    public function getTotalStockFromWarehousesAttribute(): int
    {
        return $this->warehouseProducts()->sum('stock');
    }
}
