<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductBarcode extends Model
{
    protected $fillable = [
        'product_base_id',
        'barcode',
        'type',
    ];

    public function productBase()
    {
        return $this->belongsTo(ProductBase::class);
    }
}