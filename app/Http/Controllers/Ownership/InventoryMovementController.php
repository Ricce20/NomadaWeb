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
use App\Models\Almacen;
use App\Models\WarehouseProduct as AlmacenProducto;
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
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sucursal_id' => 'required|exists:sucursales,id',
            'almacen_id' => 'required|exists:almacenes,id',
            'type' => 'required|in:in,out,adjust',
            'reason' => 'nullable|string|max:255',
            'status' => 'required|in:pendiente,completado',
            'products' => 'required|array|min:1',
            'products.*.product_base_branch_id' => 'required|exists:product_base_branch,id',
            'products.*.quantity' => 'required|integer|min:1',
            'products.*.notes' => 'nullable|string|max:255',
        ]);


        $sucursal = Sucursal::find($validated['sucursal_id']);

        if (!$sucursal) {
            return back()->withErrors(['sucursal_id' => 'Sucursal no encontrada.']);
        }

        // Verificar que el almacén pertenece a esta sucursal
        $warehouse = Almacen::where('id', $validated['almacen_id'])
            ->where('sucursal_id', $sucursal->id)
            ->first();

        if (!$warehouse) {
            return back()->withErrors(['almacen_id' => 'El almacén no pertenece a esta sucursal.']);
        }

        // Registrar movimiento usando el servicio
        $service = new InventoryService();
        
        try {
            $movement = $service->registerMovement(
                warehouse: $warehouse,
                products: $validated['products'],
                type: $validated['type'],
                user: $request->user(),
                reason: $validated['reason'],
                status: $validated['status'],
                sucursal_id: $sucursal->id
            );

            $typeLabel = match($validated['type']) {
                'in' => 'Entrada',
                'out' => 'Salida',
                'adjust' => 'Ajuste',
                default => 'Movimiento'
            };
            
            return redirect()->back()->with('success', "{$typeLabel} de inventario registrado correctamente.");
                
        } catch (\Exception $e) {
            return back()
                ->withErrors(['error' => 'Error al registrar el movimiento: ' . $e->getMessage()])
                ->withInput();
        }
    }


   public function indexParaEmpleado(Request $request)
    {
        $sucursalId = auth()->user()->sucursales()->pluck('sucursales.id')->first();
        $sucursal = Sucursal::findOrFail($sucursalId);
        
        // Obtener IDs de warehouses de esta sucursal
        $warehouseIds = Almacen::where('sucursal_id', $sucursalId)->pluck('id');

        // Query base
        $query = InventoryMovement::whereIn('almacen_id', $warehouseIds)
            ->with([
                'warehouse:id,nombre',
                'performedBy:id,name'
            ]);

        // Aplicar filtros si existen
        if ($request->has('search') && $request->search) {
            $query->where('movement_number', 'like', '%' . $request->search . '%')
                ->orWhere('reason', 'like', '%' . $request->search . '%');
        }

        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Obtener movimientos con paginación
        $movements = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString() // Mantener los parámetros de query en la paginación
            ->through(function ($movement) {
                return [
                    'id' => $movement->id,
                    'warehouse_name' => $movement->warehouse?->nombre ?? 'N/A',
                    'movement_number' => $movement->movement_number,
                    'type' => $movement->type,
                    'status' => $movement->status,
                    'reason' => $movement->reason,
                    'performed_by_name' => $movement->performedBy?->name ?? 'Sistema',
                    'created_at' => $movement->created_at->format('d/m/Y H:i'),
                ];
            });

        return Inertia::render('empleados/almacen/movimientos', [
            'sucursal' => [
                'id' => $sucursal->id,
                'nombre' => $sucursal->nombre,
            ],
            'movements' => $movements,
            'filters' => $request->only(['search', 'type', 'status']), // Pasar filtros a la vista
        ]);
    }

    public function createParaEmpleado()
    {
        $sucursalId = auth()->user()->sucursales()->pluck('sucursales.id')->first();
        $sucursal = Sucursal::findOrFail($sucursalId);

        // Obtener almacenes activos de la sucursal (solo lo esencial)
        $warehouses = Almacen::where('sucursal_id', $sucursal->id)
            ->where('activo', true) // Solo almacenes activos
            ->orderBy('nombre')
            ->get()
            ->map(function ($warehouse) {
                return [
                    'id' => $warehouse->id,
                    'nombre' => $warehouse->nombre,
                    'activo' => $warehouse->activo,
                ];
            });

        return Inertia::render('empleados/almacen/crear-movimiento', [
            'sucursal' => [
                'id' => $sucursal->id,
                'nombre' => $sucursal->nombre,
            ],
            'warehouses' => $warehouses,
            // Ya no enviamos todos los productos
        ]);


    }

    public function show(string | int $id)
    {
        $sucursalId = auth()->user()->sucursales()->pluck('sucursales.id')->first();
        $sucursal = Sucursal::findOrFail($sucursalId);

        $movimiento = InventoryMovement::findOrFail($id);
    
        // Verificar que el movimiento pertenece a la sucursal
        if ($movimiento->sucursal_id !== $sucursalId) {
            abort(404);
        }

        // Cargar relaciones necesarias
        $movimiento->load([
            'warehouse',
            'performedBy',

            'details.productBaseBranch.productBase' => function($query) {
                $query->with(['brand', 'category', 'uom']);
            }
        ]);

        return Inertia::render('empleados/almacen/detalle-movimiento', [
            'sucursal' => [
                'id' => $sucursal->id,
                'nombre' => $sucursal->nombre,
            ],
            'movimiento' => [
                'id' => $movimiento->id,
                'movement_number' => $movimiento->movement_number,
                'type' => $movimiento->type,
                'status' => $movimiento->status,
                'reason' => $movimiento->reason,
                'created_at' => $movimiento->created_at->format('d/m/Y H:i'),
                'warehouse' => [
                    'id' => $movimiento->warehouse->id,
                    'nombre' => $movimiento->warehouse->nombre,
                ],
                'created_by' => [
                    'name' => $movimiento->performedBy?->name ?? 'N/A',
                ],
                'approved_by' => $movimiento->approvedBy ? [
                    'name' => $movimiento->approvedBy->name,
                ] : null,
                'details' => $movimiento->details->map(function($detail) use ($movimiento) {
                    $productBase = $detail->productBaseBranch->productBase;

                    // 📌 Obtener stock actual del producto en ese almacén
                    $stockActual = AlmacenProducto::where('almacen_id', $movimiento->almacen_id)
                        ->where('product_base_branch_id', $detail->product_base_branch_id)
                        ->pluck('stock')
                        ->first() ?? 0;

                    return [
                        'id' => $detail->id,
                        'product_name' => $productBase->name,
                        'sku' => $productBase->sku_base,
                        'unidad_medida' => $productBase->uom->abbreviation ?? 'UND',
                        'marca' => $productBase->brand->name ?? null,
                        'categoria' => $productBase->category->name ?? null,
                        'quantity' => $detail->quantity,
                        'previous_stock' => $detail->previous_stock,
                        'new_stock' => $detail->new_stock,
                        'notes' => $detail->notes,
                        'diferencia_stock' => $detail->new_stock - $detail->previous_stock,

                        // 📌 AGREGADO: stock actual REAL del producto en ese almacén
                        'stock_actual' => $stockActual,
                    ];
                }),
            ]
        ]);
    }

     public function completeMovement(Request $request, string | int $movimientoId)
    {
        
        $sucursalId = auth()->user()->sucursales()->pluck('sucursales.id')->first();
        $sucursal = Sucursal::findOrFail($sucursalId);
        $movimiento = InventoryMovement::findOrFail($movimientoId);

        if($movimiento->sucursal_id !== $sucursal->id) {
            return back()->with(['error' => 'El movimiento no pertenece a esta sucursal.']);
        }

        // Validar que el movimiento está pendiente
        if ($movimiento->status !== 'pendiente') {
            return back()->withErrors(['error' => 'Solo se pueden completar movimientos pendientes.']);
        }

        $service = new InventoryService();

        try {
            $service->updateMovementStatus(
                $movimiento,
                'completado',
                $request->user()
            );

            return redirect()->back()->with('success', 'Movimiento completado correctamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Error al completar el movimiento: ' . $e->getMessage()]);
        }
    }

    public function cancelMovement(Request $request, string | int $movimientoId)
    {
        $sucursalId = auth()->user()->sucursales()->pluck('sucursales.id')->first();
        $sucursal = Sucursal::findOrFail($sucursalId);
        $movimiento = InventoryMovement::findOrFail($movimientoId);
        
        if($movimiento->sucursal_id !== $sucursal->id) {
            return back()->with(['error' => 'El movimiento no pertenece a esta sucursal.']);
        }

        // Validar que el movimiento está pendiente o completado
        if (!in_array($movimiento->status, ['pendiente', 'completado'])) {
            return back()->withErrors(['error' => 'No se puede cancelar un movimiento ya cancelado.']);
        }
        $service = new InventoryService();

        try {
            $service->updateMovementStatus(
                $movimiento,
                'cancelado',
                $request->user()
            );

            return redirect()->back()->with('success', 'Movimiento cancelado correctamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Error al cancelar el movimiento: ' . $e->getMessage()]);
        }
    }
    
}
