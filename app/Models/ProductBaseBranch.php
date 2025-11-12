<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductBaseBranch extends Model
{
    protected $table = 'product_base_branch';

    protected $fillable = [
        'product_base_id',
        'branch_id',
        'price',
        'stock',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock' => 'integer',
    ];

    public function productBase()
    {
        return $this->belongsTo(ProductBase::class, 'product_base_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
