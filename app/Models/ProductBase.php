<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductBase extends Model
{
    use HasFactory, SoftDeletes;

    // Estados de aprobación
    public const STATUS_APPROVED = 'approved';  // Producto corporativo aprobado (catálogo global)
    public const STATUS_PENDING = 'pending';    // Producto pendiente de aprobación
    public const STATUS_REJECTED = 'rejected';  // Producto rechazado
    public const STATUS_LOCAL = 'local';        // Producto local de sucursal (no aparece en catálogo global)
    public const STATUS_ARCHIVED = 'archived';  // Producto archivado (estaba en uso, no se pudo eliminar)

    protected $fillable = [
        'sku_base',
        'name',
        'brand_id',
        'category_id',
        'uom_id',
        'tax_code',
        'specs_json',
        'is_active',
        'approval_status',
        'origin_negocio_id',
        'created_by',
        'approved_at',
        'rejected_at',
    ];

    protected $casts = [
        'specs_json' => 'array',
        'is_active' => 'boolean',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function uom()
    {
        return $this->belongsTo(Unit::class, 'uom_id');
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function barcodes()
    {
        return $this->hasMany(ProductBarcode::class);
    }

    public function prices()
    {
        return $this->hasMany(ProductBaseBranch::class, 'product_base_id');
    }

    public function branches()
    {
        return $this->belongsToMany(Branch::class, 'product_base_branch')
            ->withPivot([
                'price',
                'stock',
            ])
            ->withTimestamps();
    }

    public function originNegocio()
    {
        return $this->belongsTo(Negocio::class, 'origin_negocio_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeApproved($query)
    {
        return $query->where('approval_status', 'approved');
    }

    public function scopeVisibleFor($query, User $user)
    {
        $negocioId = optional($user->negocio()->first())->id;
        return $query->where(function ($q) use ($negocioId) {
            $q->where('approval_status', 'approved')
                ->orWhere(function ($w) use ($negocioId) {
                    $w->where('approval_status', 'pending')
                        ->where('origin_negocio_id', $negocioId);
                });
        });
    }
}