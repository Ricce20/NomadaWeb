<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductBase extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sku_base',
        'name',
        'brand_id',
        'category_id',
        'uom_id',
        'tax_code',
        'specs_json',
        'is_active',
    ];

    protected $casts = [
        'specs_json' => 'array',
        'is_active' => 'boolean',
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
}