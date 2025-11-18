<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
    protected $fillable = [
        'product_base_id',
        'path',
        'is_primary',
        'sort_order',
    ];

    public function productBase()
    {
        return $this->belongsTo(ProductBase::class);
    }
}