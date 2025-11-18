<?php

namespace App\Http\Controllers\Ownership;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ownership\StoreBranchProductRequest;
use App\Http\Requests\Ownership\UpdateBranchProductRequest;
use App\Models\Brand;
use App\Models\Category;
use App\Models\ProductBaseBranch;
use App\Models\Sucursal;
use App\Models\Unit;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BranchProductController extends Controller
{
    use AuthorizesRequests;
    /**
     * Display a listing of products for the branch.
     */
    public function index(Sucursal $sucursal, Request $request)
    {
        $this->authorize('viewProducts', $sucursal);

        // Query con joins
        $query = ProductBaseBranch::query()
            ->where('branch_id', $sucursal->id)
            ->with([
                'productBase.brand',
                'productBase.category',
                'productBase.uom',
                'productBase.images' => function ($q) {
                    $q->orderBy('is_primary', 'desc')->orderBy('sort_order');
                }
            ]);

        // Filtros
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('productBase', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhere('sku_base', 'like', "%{$search}%");
            });
        }

        if ($request->filled('brand_id')) {
            $query->whereHas('productBase', function ($q) use ($request) {
                $q->where('brand_id', $request->brand_id);
            });
        }

        if ($request->filled('category_id')) {
            $query->whereHas('productBase', function ($q) use ($request) {
                $q->where('category_id', $request->category_id);
            });
        }

        // Ordenamiento
        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        // Paginación con protección null-safe
        $productos = $query->paginate(20)->withQueryString()->through(function($item) {
            $base = $item->productBase;
            
            return [
                'id' => $item->id,
                'product_base_id' => $item->product_base_id,
                'name' => $base?->name ?? '[Producto eliminado del catálogo]',
                'sku_base' => $base?->sku_base ?? 'N/A',
                'brand' => $base?->brand?->name ?? 'N/A',
                'category' => $base?->category?->name ?? 'N/A',
                'unit' => $base?->uom?->abbreviation ?? 'N/A',
                'price' => $item->price,
                'stock' => $item->stock,
                'branch_image' => $item->image_path,
                'catalog_image' => $base?->images->first()?->path,
                'image' => $item->image_path ?? $base?->images->first()?->path,
                'updated_at' => $item->updated_at->format('d/m/Y'),
                'created_at' => $item->created_at->format('d/m/Y'),
                'is_orphan' => $base === null, // Indicador de producto huérfano
            ];
        });

        return Inertia::render('sucursales/productos/Index', [
            'items' => $productos,
            'sucursal' => $sucursal,
            'can' => [
                'manage' => $request->user()->can('manage', $sucursal),
                'stock' => $request->user()->can('stock', $sucursal),
            ],
            'brands' => Brand::select('id', 'name')->orderBy('name')->get(),
            'categories' => Category::select('id', 'name')->orderBy('name')->get(),
            'units' => Unit::select('id', 'name', 'abbreviation')->orderBy('name')->get(),
            'filters' => [
                'search' => $request->search,
                'brand_id' => $request->brand_id,
                'category_id' => $request->category_id,
                'sort' => $sortField,
                'direction' => $sortDirection,
            ],
        ]);
    }

    /**
     * Store a newly created product price in the branch.
     */
    public function store(Sucursal $sucursal, StoreBranchProductRequest $request)
    {
        // Authorization handled by FormRequest

        $validated = $request->validated();

        // Usar firstOrCreate para manejar race conditions
        $pivot = ProductBaseBranch::firstOrCreate(
            [
                'product_base_id' => $validated['product_base_id'],
                'branch_id' => $sucursal->id,
            ],
            [
                'price' => $validated['price'],
                'stock' => $validated['stock'] ?? 0,
                'sale_type' => 'unit', // Default: venta por unidad
            ]
        );

        if ($pivot->wasRecentlyCreated) {
            return redirect()->back()->with(['success' => 'Producto agregado correctamente']);
        }

        return redirect()->back()->with(['error' => 'Este producto ya está registrado en esta sucursal']);
    }

    /**
     * Update the specified product price in the branch.
     */
    public function update(Sucursal $sucursal, ProductBaseBranch $pivot, UpdateBranchProductRequest $request)
    {
        // Authorization handled by FormRequest

        // Verificar que el pivot pertenece a la sucursal
        abort_unless($pivot->branch_id === $sucursal->id, 403);

        $data = $request->only(['price', 'stock']);
        // Evita tocar campos no enviados:
        $data = array_filter($data, fn($v) => !is_null($v));

        // Si no viene nada válido, 422
        if (empty($data)) {
            return back()->withErrors(['message' => 'No hay cambios a aplicar'])->setStatusCode(422);
        }

        $pivot->fill($data)->save();

        return back()->with('success', 'Actualizado');
    }

    /**
     * Remove the specified product price from the branch.
     */
    public function destroy(Sucursal $sucursal, ProductBaseBranch $pivot)
    {
        $this->authorize('manageProducts', $sucursal);

        // Verificar que el pivot pertenece a la sucursal
        if ($pivot->branch_id !== $sucursal->id) {
            abort(403, 'Este producto no pertenece a la sucursal especificada.');
        }

        $pivot->delete();

        return redirect()->back()->with(['success' => 'Producto eliminado exitosamente']);
    }

    /**
     * Quick add: Create a new product base and add it to the branch.
     */
    public function quickAdd(Sucursal $sucursal, \App\Http\Requests\QuickAddProductRequest $request)
    {
        $this->authorize('manage', $sucursal);

        \Illuminate\Support\Facades\DB::transaction(function () use ($sucursal, $request, &$sku, &$base) {
            $user = $request->user();
            $negocioId = optional($user->negocio()->first())->id;

            $sku = $request->input('sku_base');
            if (!$sku || trim($sku) === '') {
                $sku = \App\Services\SkuGenerator::make($negocioId, (string) $request->input('name'));
            }

            $base = \App\Models\ProductBase::create([
                'sku_base' => $sku,
                'name' => $request->string('name'),
                'brand_id' => $request->integer('brand_id'),
                'category_id' => $request->integer('category_id'),
                'uom_id' => $request->integer('uom_id'),
                'tax_code' => $request->input('tax_code'),
                'specs_json' => $request->input('specs_json', []),
                'is_active' => true,
                'approval_status' => \App\Models\ProductBase::STATUS_LOCAL,
                'origin_negocio_id' => $negocioId,
                'created_by' => $user->id,
            ]);

            // Manejar imagen si se proporciona
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('product-images', 'public');
                $base->images()->create([
                    'path' => $path,
                    'is_primary' => true,
                    'sort_order' => 0,
                ]);
            }

            ProductBaseBranch::firstOrCreate(
                ['product_base_id' => $base->id, 'branch_id' => $sucursal->id],
                [
                    'price' => (float) $request->input('price'),
                    'stock' => (int) $request->input('stock'),
                    'sale_type' => 'unit', // Default: venta por unidad
                ]
            );
        });

        return back()->with('success', "Producto creado para tu negocio y agregado a la sucursal (SKU: {$sku})");
    }

    /**
     * Update branch-specific product image (not catalog image)
     */
    public function updateImage(Sucursal $sucursal, ProductBaseBranch $pivot, Request $request)
    {
        $this->authorize('manage', $sucursal);

        // Verificar que el pivot pertenece a la sucursal
        abort_unless($pivot->branch_id === $sucursal->id, 403);

        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        // Eliminar imagen anterior de sucursal si existe
        if ($pivot->image_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($pivot->image_path);
        }

        // Guardar nueva imagen específica de sucursal
        $path = $request->file('image')->store(
            'branch-products/' . $sucursal->id,
            'public'
        );

        $pivot->image_path = $path;
        $pivot->save();

        return back()->with('success', 'Imagen de sucursal actualizada correctamente');
    }

    /**
     * Delete branch-specific product image (revert to catalog image)
     */
    public function destroyImage(Sucursal $sucursal, ProductBaseBranch $pivot)
    {
        $this->authorize('manage', $sucursal);

        // Verificar que el pivot pertenece a la sucursal
        abort_unless($pivot->branch_id === $sucursal->id, 403);

        if ($pivot->image_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($pivot->image_path);
            $pivot->image_path = null;
            $pivot->save();
        }

        return back()->with('success', 'Imagen personalizada eliminada. Ahora se mostrará la imagen del catálogo.');
    }

    /**
     * Get catalog of available products for the branch
     */
    public function catalog(Sucursal $sucursal, Request $request)
    {
        $this->authorize('viewProducts', $sucursal);

        Log::info('Catalog request', [
            'sucursal_id' => $sucursal->id,
            'search' => $request->get('search'),
            'exclude_added' => $request->boolean('exclude_added', true),
        ]);

        $query = \App\Models\ProductBase::query()
            ->with([
                'brand:id,name',
                'category:id,name',
                'uom:id,name,abbreviation',
                'images' => function ($q) {
                    // Solo cargar la imagen principal, sin usar orWhereRaw que causa problemas
                    $q->where('is_primary', true)
                      ->orderBy('sort_order')
                      ->limit(1);
                }
            ])
            ->where('is_active', true)
            ->where('approval_status', \App\Models\ProductBase::STATUS_APPROVED)
            // Solo productos corporativos (sin negocio de origen)
            // Los productos rápidos locales NO deben aparecer en el catálogo
            ->whereNull('origin_negocio_id');

        // Filtrar por búsqueda
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku_base', 'like', "%{$search}%");
            });
        }

        // Filtrar por marca
        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }

        // Filtrar por categoría
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Excluir productos ya agregados a esta sucursal (opcional)
        if ($request->boolean('exclude_added', true)) {
            $existingIds = ProductBaseBranch::where('branch_id', $sucursal->id)
                ->pluck('product_base_id')
                ->toArray();
            
            if (!empty($existingIds)) {
                $query->whereNotIn('id', $existingIds);
            }
        }

        // Obtener productos sin paginar primero para evitar problemas con laravel_row
        $products = $query->orderBy('name')->get();
        
        // Transformar manualmente
        $data = $products->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'sku_base' => $item->sku_base,
                'brand' => $item->brand?->name ?? 'N/A',
                'brand_id' => $item->brand_id,
                'category' => $item->category?->name ?? 'N/A',
                'category_id' => $item->category_id,
                'unit' => $item->uom?->abbreviation ?? 'N/A',
                'unit_name' => $item->uom?->name ?? 'N/A',
                'image' => $item->images->first()?->path,
                'tax_code' => $item->tax_code,
            ];
        });

        // Paginar manualmente los resultados transformados
        $page = $request->input('page', 1);
        $perPage = 20;
        $total = $data->count();
        $items = $data->slice(($page - 1) * $perPage, $perPage)->values();
        
        $paginator = new \Illuminate\Pagination\LengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        Log::info('Catalog response', [
            'total' => $paginator->total(),
            'count' => $paginator->count(),
        ]);

        return response()->json($paginator);
    }

    /**
     * Add product from catalog to branch
     */
    public function fromCatalog(Sucursal $sucursal, Request $request)
    {
        $this->authorize('manage', $sucursal);

        $validated = $request->validate([
            'product_base_id' => ['required', 'exists:product_bases,id'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
        ]);

        // Verificar que el producto esté activo y aprobado
        $productBase = \App\Models\ProductBase::findOrFail($validated['product_base_id']);
        
        if (!$productBase->is_active || $productBase->approval_status !== \App\Models\ProductBase::STATUS_APPROVED) {
            return back()->withErrors(['error' => 'Este producto no está disponible en el catálogo']);
        }

        // Crear o actualizar el registro
        $pivot = ProductBaseBranch::firstOrCreate(
            [
                'product_base_id' => $validated['product_base_id'],
                'branch_id' => $sucursal->id,
            ],
            [
                'price' => $validated['price'],
                'stock' => $validated['stock'],
                'sale_type' => 'unit', // Default: venta por unidad
            ]
        );

        if ($pivot->wasRecentlyCreated) {
            return back()->with(['success' => 'Producto agregado desde el catálogo']);
        }

        return back()->with(['error' => 'Este producto ya está registrado en esta sucursal']);
    }

}
