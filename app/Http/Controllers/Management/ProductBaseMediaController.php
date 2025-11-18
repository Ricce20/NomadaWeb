<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Models\ProductBase;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductBaseMediaController extends Controller
{
    public function store(ProductBase $product, Request $r)
    {
        $r->validate(['images.*' => 'required|image|max:2048']);

        $hasPrimary = $product->images()->where('is_primary', 1)->exists();
        foreach ($r->file('images', []) as $file) {
            $path = $file->store('product-images', 'public');
            $product->images()->create([
                'path'       => $path,
                'is_primary' => $hasPrimary ? 0 : 1,
                'sort_order' => $product->images()->count(),
            ]);
            $hasPrimary = true;
        }
        return back()->with('ok', 'Imágenes subidas');
    }

    public function destroy(ProductBase $product, ProductImage $image)
    {
        abort_if($image->product_base_id !== $product->id, 404);
        Storage::disk('public')->delete($image->path);
        $image->delete();
        return back()->with('ok', 'Imagen eliminada');
    }
}