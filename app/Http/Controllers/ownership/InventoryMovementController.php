<?php

namespace App\Http\Controllers\Ownership;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ownership\StoreInventoryMovementRequest;
use App\Models\Sucursal;
use App\Models\Warehouse;
use App\Models\ProductBaseBranch;
use App\Models\InventoryMovement;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryMovementController extends Controller
{
    /**
     * Display a listing of inventory movements for the branch.
     */
    public function index(Sucursal $sucursal)
    {
        // Obtener IDs de warehouses de esta sucursal
        $warehouseIds = Warehouse::where('branch_id', $sucursal->id)->pluck('id');

        // Obtener movimientos de inventario
        $movements = InventoryMovement::whereIn('warehouse_id', $warehouseIds)
            ->with([
                'warehouse:id,name',
                'productBaseBranch.productBase:id,name,sku_base',
                'performedBy:id,name'
            ])
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(function ($movement) {
                $productBase = $movement->productBaseBranch?->productBase;
                
                return [
                    'id' => $movement->id,
                    'warehouse_name' => $movement->warehouse?->name ?? 'N/A',
                    'product_name' => $productBase?->name ?? '[Producto eliminado]',
                    'sku' => $productBase?->sku_base ?? 'N/A',
                    'type' => $movement->type,
                    'quantity' => $movement->quantity,
                    'previous_stock' => $movement->previous_stock,
                    'new_stock' => $movement->new_stock,
                    'reason' => $movement->reason,
                    'performed_by_name' => $movement->performedBy?->name ?? 'Sistema',
                    'created_at' => $movement->created_at->format('d/m/Y H:i'),
                ];
            });

        return Inertia::render('sucursales/movimientos-inventario/Index', [
            'sucursal' => [
                'id' => $sucursal->id,
                'nombre' => $sucursal->nombre,
            ],
            'movements' => $movements,
        ]);
    }

    /**
     * Show the form for creating a new inventory movement.
     */
    public function create(Sucursal $sucursal)
    {
        // Obtener almacenes activos de la sucursal
        $warehouses = Warehouse::where('branch_id', $sucursal->id)
            ->where('status', 'active')
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get()
            ->map(function ($warehouse) {
                return [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                    'is_default' => $warehouse->is_default,
                ];
            });

        // Obtener productos de la sucursal
        $products = ProductBaseBranch::where('branch_id', $sucursal->id)
            ->with('productBase:id,name,sku_base')
            ->get()
            ->map(function ($productBranch) {
                $productBase = $productBranch->productBase;
                return [
                    'id' => $productBranch->id,
                    'name' => $productBase?->name ?? '[Producto eliminado]',
                    'sku' => $productBase?->sku_base ?? 'N/A',
                    'current_stock' => $productBranch->stock,
                ];
            })
            ->filter(function ($product) {
                return $product['name'] !== '[Producto eliminado]';
            })
            ->values();

        return Inertia::render('sucursales/movimientos-inventario/Create', [
            'sucursal' => [
                'id' => $sucursal->id,
                'nombre' => $sucursal->nombre,
            ],
            'warehouses' => $warehouses,
            'products' => $products,
        ]);
    }

    /**
     * Store a newly created inventory movement.
     */
    public function store(Sucursal $sucursal, StoreInventoryMovementRequest $request)
    {
        $validated = $request->validated();

        // Verificar que el warehouse pertenece a esta sucursal
        $warehouse = Warehouse::where('id', $validated['warehouse_id'])
            ->where('branch_id', $sucursal->id)
            ->first();

        if (!$warehouse) {
            return back()->withErrors(['warehouse_id' => 'El almacén no pertenece a esta sucursal.']);
        }

        // Verificar que el producto pertenece a esta sucursal
        $productBaseBranch = ProductBaseBranch::where('id', $validated['product_base_branch_id'])
            ->where('branch_id', $sucursal->id)
            ->first();

        if (!$productBaseBranch) {
            return back()->withErrors(['product_base_branch_id' => 'El producto no pertenece a esta sucursal.']);
        }

        // Registrar movimiento usando el servicio
        $service = new InventoryService();
        
        try {
            $movement = $service->registerMovement(
                warehouse: $warehouse,
                productBaseBranch: $productBaseBranch,
                type: $validated['type'],
                quantity: $validated['quantity'],
                user: $request->user(),
                reason: $validated['reason'] ?? null
            );

            $typeLabel = $validated['type'] === 'in' ? 'Entrada' : 'Ajuste';
            
            return redirect()
                ->route('sucursales.inventario.show', ['sucursal' => $sucursal->id, 'warehouse' => $warehouse->id])
                ->with('success', "{$typeLabel} de inventario registrado correctamente.");
                
        } catch (\Exception $e) {
            return back()
                ->withErrors(['error' => 'Error al registrar el movimiento: ' . $e->getMessage()])
                ->withInput();
        }
    }
}
