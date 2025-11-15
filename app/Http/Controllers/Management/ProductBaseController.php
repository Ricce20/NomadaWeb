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
            // Solo mostrar productos corporativos (aprobados y sin negocio de origen)
            // Los productos rápidos creados desde sucursales NO deben aparecer aquí
            ->where('approval_status', ProductBase::STATUS_APPROVED)
            ->whereNull('origin_negocio_id')
            ->when($req->search, function ($q) use ($req) {
                $q->where(function ($query) use ($req) {
                    $query->where('name', 'like', "%{$req->search}%")
                          ->orWhere('sku_base', 'like', "%{$req->search}%");
                });
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
        return Inertia::render('Management/ProductBase/Create', [
            'mode' => 'create',
            'catalogs' => [
                'brands' => \App\Models\Brand::select('id', 'name')->orderBy('name')->get(),
                'categories' => \App\Models\Category::select('id', 'name')->orderBy('name')->get(),
                'uoms' => \App\Models\Unit::select('id', 'name', 'abbreviation')->orderBy('name')->get(),
            ],
        ]);
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
            'mode' => 'edit',
            'item' => $product_base->load(['brand', 'category', 'uom', 'barcodes', 'images']),
            'catalogs' => [
                'brands' => \App\Models\Brand::select('id', 'name')->orderBy('name')->get(),
                'categories' => \App\Models\Category::select('id', 'name')->orderBy('name')->get(),
                'uoms' => \App\Models\Unit::select('id', 'name', 'abbreviation')->orderBy('name')->get(),
            ],
        ]);
    }

    public function update(StoreUpdateProductBaseRequest $req, ProductBase $product_base)
    {
        $product_base->update($req->validated());
        return back()->with('ok', 'Producto actualizado');
    }

    public function destroy(Request $request, ProductBase $product_base)
    {
        // Validar que sea super_admin
        if ($request->user()->type !== 'super_admin') {
            return back()->withErrors(['error' => 'Solo super_admin puede eliminar productos del catálogo']);
        }

        // Validar contraseña
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        if (!\Illuminate\Support\Facades\Hash::check($request->password, $request->user()->password)) {
            return back()->withErrors(['password' => 'La contraseña es incorrecta']);
        }

        // Verificar si el producto está siendo usado por sucursales
        $inUse = ProductBaseBranch::where('product_base_id', $product_base->id)->exists();
        
        if ($inUse) {
            // No eliminar, solo marcar como inactivo y archivado
            $product_base->update([
                'is_active' => false,
                'approval_status' => ProductBase::STATUS_ARCHIVED,
            ]);
            
            return redirect()
                ->route('management.product-bases.index')
                ->with('warning', 'Este producto está siendo usado por sucursales. Se marcó como inactivo/archivado en lugar de eliminarlo.');
        }

        // Si no está en uso, permitir eliminación normal
        $product_base->delete();
        
        return redirect()
            ->route('management.product-bases.index')
            ->with('ok', 'Producto eliminado correctamente');
    }

    // Media
    public function imagesStore(ProductBase $product, Request $req)
    {
        $req->validate([
            'images' => ['required', 'array', 'min:1'],
            'images.*' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
        ]);

        $uploaded = [];
        $currentMaxOrder = $product->images()->max('sort_order') ?? -1;

        foreach ($req->file('images') as $index => $file) {
            // Crear directorio específico para el producto
            $directory = "product-images/{$product->id}";
            $path = $file->store($directory, 'public');

            $image = $product->images()->create([
                'path' => $path,
                'is_primary' => $product->images()->count() === 0 && $index === 0,
                'sort_order' => $currentMaxOrder + $index + 1,
            ]);

            $uploaded[] = $image;
        }

        return back()->with('ok', count($uploaded) . ' imagen(es) subida(s) correctamente');
    }

    public function imagesDestroy(ProductBase $product, int $image)
    {
        $img = $product->images()->findOrFail($image);
        
        // Eliminar archivo físico
        \Illuminate\Support\Facades\Storage::disk('public')->delete($img->path);
        
        // Si era la imagen principal, asignar otra como principal
        $wasPrimary = $img->is_primary;
        $img->delete();

        if ($wasPrimary) {
            $nextImage = $product->images()->orderBy('sort_order')->first();
            if ($nextImage) {
                $nextImage->update(['is_primary' => true]);
            }
        }

        return back()->with('ok', 'Imagen eliminada correctamente');
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