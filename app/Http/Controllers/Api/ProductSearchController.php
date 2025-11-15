<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductBase;
use Illuminate\Http\Request;

class ProductSearchController extends Controller
{
    public function search(Request $request)
    {
        $request->validate([
            'term' => 'required|string|min:2',
            'exclude_branch_id' => 'nullable|integer|exists:sucursales,id',
        ]);

        $query = ProductBase::query()
            ->where('is_active', true)
            ->whereNull('deleted_at') // Excluir soft-deleted
            ->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->term}%")
                    ->orWhere('sku_base', 'like', "%{$request->term}%");
            });

        // Excluir productos ya asociados a una sucursal específica
        if ($request->filled('exclude_branch_id')) {
            $query->whereDoesntHave('prices', function ($q) use ($request) {
                $q->where('branch_id', $request->exclude_branch_id);
            });
        }

        $products = $query
            ->with(['brand', 'category', 'uom'])
            ->limit(10)
            ->get()
            ->map(fn($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'sku_base' => $product->sku_base,
                'brand' => $product->brand->name ?? 'N/A',
                'category' => $product->category->name ?? 'N/A',
                'unit' => $product->uom->abbreviation ?? 'N/A',
            ]);

        return response()->json($products);
    }
}
