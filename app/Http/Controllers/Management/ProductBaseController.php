<?php

namespace App\Http\Controllers\Management;

use App\Models\ProductBase;
use App\Models\ProductBarcode;
use App\Models\ProductBaseBranch;
use App\Http\Requests\Management\StoreUpdateProductBaseRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductBaseController
{
    public function index(Request $req)
    {
        $items = ProductBase::with(['brand', 'category', 'uom'])
            ->when($req->search, function ($q) use ($req) {
                $q->where('name', 'like', "%{$req->search}%")
                  ->orWhere('sku_base', 'like', "%{$req->search}%");
            })
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Management/ProductBase/Index', [
            'items' => $items,
            'filters' => $req->only('search'),
        ]);
    }

    public function create()
    {
        return Inertia::render('Management/ProductBase/Create');
    }

    public function store(StoreUpdateProductBaseRequest $req)
    {
        $pb = ProductBase::create($req->validated());

        if ($req->filled('barcodes')) {
            foreach ((array) $req->barcodes as $code) {
                if ($code !== null && $code !== '') {
                    ProductBarcode::firstOrCreate(
                        ['product_base_id' => $pb->id, 'barcode' => $code],
                        ['type' => 'EAN13']
                    );
                }
            }
        }

        if ($req->hasFile('images')) {
            foreach ($req->file('images') as $i => $file) {
                $path = $file->store('product-images', 'public');
                $pb->images()->create([
                    'path' => $path,
                    'is_primary' => $i === 0,
                    'sort_order' => $i,
                ]);
            }
        }

        return redirect()
            ->route('management.product-bases.index')
            ->with('ok', 'Producto creado');
    }

    public function show(ProductBase $product_base)
    {
        return response()->json(['ok' => true, 'resource' => 'product-bases.show', 'id' => $product_base->id]);
    }

    public function edit(ProductBase $product_base)
    {
        return Inertia::render('Management/ProductBase/Edit', [
            'item' => $product_base->load(['brand', 'category', 'uom', 'barcodes', 'images']),
        ]);
    }

    public function update(StoreUpdateProductBaseRequest $req, ProductBase $product_base)
    {
        $product_base->update($req->validated());
        return back()->with('ok', 'Producto actualizado');
    }

    public function destroy(ProductBase $product_base)
    {
        $product_base->delete();
        return redirect()
            ->route('management.product-bases.index')
            ->with('ok', 'Producto eliminado');
    }

    // Media
    public function imagesStore(ProductBase $product)
    {
        return response()->json(['ok' => true, 'resource' => 'product-bases.images.store', 'id' => $product->id]);
    }

    public function imagesDestroy(ProductBase $product, int $image)
    {
        return response()->json(['ok' => true, 'resource' => 'product-bases.images.destroy', 'id' => $product->id, 'image' => $image]);
    }

    // DEPRECATED: Pricing management moved to Ownership
    // Los precios por sucursal se administran en: /sucursales/{id}/productos
    // Solo Owner/Manager pueden gestionar precios de sus sucursales

    // Soft delete management
    public function restore(int $id)
    {
        $product = ProductBase::withTrashed()->findOrFail($id);
        $product->restore();

        return back()->with('ok', 'Producto restaurado exitosamente');
    }

    public function forceDelete(int $id)
    {
        $product = ProductBase::withTrashed()->findOrFail($id);
        $product->forceDelete();

        return redirect()
            ->route('management.product-bases.index')
            ->with('ok', 'Producto eliminado permanentemente');
    }
}