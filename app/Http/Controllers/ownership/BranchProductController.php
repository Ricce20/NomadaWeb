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
            ->where('sucursal_id', $sucursal->id)
            ->with([
                'productBase.brand',
                'productBase.category',
                'productBase.uom'
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

        // Paginación
        $productos = $query->paginate(20)->withQueryString()->through(fn($item) => [
            'id' => $item->id,
            'product_base_id' => $item->product_base_id,
            'name' => $item->productBase->name ?? 'N/A',
            'sku_base' => $item->productBase->sku_base ?? 'N/A',
            'brand' => $item->productBase->brand->name ?? 'N/A',
            'category' => $item->productBase->category->name ?? 'N/A',
            'unit' => $item->productBase->uom->abbreviation ?? 'N/A',
            'price' => $item->price,
            'stock' => $item->stock,
            'updated_at' => $item->updated_at->format('d/m/Y'),
            'created_at' => $item->created_at->format('d/m/Y')
        ]);

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
                'sucursal_id' => $sucursal->id,
            ],
            [
                'price' => $validated['price'],
                'stock' => $validated['stock'] ?? 0,
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
        abort_unless($pivot->sucursal_id === $sucursal->id, 403);

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
        if ($pivot->sucursal_id !== $sucursal->id) {
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

        \Illuminate\Support\Facades\DB::transaction(function () use ($sucursal, $request, &$sku) {
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
                'approval_status' => 'pending',
                'origin_negocio_id' => $negocioId,
                'created_by' => $user->id,
            ]);

            ProductBaseBranch::firstOrCreate(
                ['product_base_id' => $base->id, 'sucursal_id' => $sucursal->id],
                ['price' => (float) $request->input('price'), 'stock' => (int) $request->input('stock')]
            );
        });

        return back()->with('success', "Producto creado para tu negocio y agregado a la sucursal (SKU: {$sku})");
    }
}
