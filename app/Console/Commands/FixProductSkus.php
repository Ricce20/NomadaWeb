<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ProductBase;

class FixProductSkus extends Command
{
    protected $signature = 'fix:product-skus';
    protected $description = 'Fix missing SKUs in ProductBase';

    public function handle()
    {
        $products = ProductBase::whereNull('sku_base')->orWhere('sku_base', '')->get();
        
        $this->info("Found {$products->count()} products without SKU");
        
        foreach ($products as $product) {
            $product->sku_base = 'SKU-' . strtoupper(substr(md5($product->name), 0, 8));
            $product->save();
            $this->line("Updated: {$product->name} -> {$product->sku_base}");
        }
        
        $this->info("Done! Updated {$products->count()} products");
        
        return 0;
    }
}
