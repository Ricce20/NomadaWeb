<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function productBases()
    {
        return $this->belongsToMany(ProductBase::class, 'branch_product_base')
            ->withPivot([
                'price',
                'cost',
                'tax_rate',
                'status',
                'min_stock',
                'max_stock',
                'reorder_point',
                'barcode_override',
                'note',
            ])
            ->withTimestamps();
    }
}
