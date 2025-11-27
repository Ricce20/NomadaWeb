<?php

namespace App\Http\Controllers\Ownership;

use App\Http\Controllers\Controller;
use App\Models\Sucursal;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WarehouseDashboardController extends Controller
{
    /**
     * Display a listing of warehouses for the branch (read-only dashboard).
     * 
     * FILTROS APLICADOS:
     * - branch_id = sucursal->id (solo almacenes de esta sucursal)
     * - status = 'active' (solo almacenes activos)
     * 
     * NOTA: Los almacenes creados desde AlmacenController se sincronizan
     * automáticamente a esta tabla con branch_id = sucursal_id
     */
    public function index(Sucursal $sucursal)
    {
        // Obtener todos los almacenes ACTIVOS de la sucursal con métricas
        $warehouses = Warehouse::where('branch_id', $sucursal->id)
            ->where('status', 'active') // Solo almacenes activos
            ->withCount('warehouseProducts as total_products')
            ->with(['warehouseProducts' => function ($query) {
                $query->selectRaw('warehouse_id, SUM(stock) as total_stock')
                    ->groupBy('warehouse_id');
            }])
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get()
            ->map(function ($warehouse) {
                return [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                    'description' => $warehouse->description,
                    'is_default' => $warehouse->is_default,
                    'status' => $warehouse->status,
                    'total_products' => $warehouse->total_products,
                    'total_stock' => $warehouse->warehouseProducts->sum('total_stock') ?? 0,
                ];
            });

        return Inertia::render('sucursales/almacenes/Dashboard', [
            'sucursal' => [
                'id' => $sucursal->id,
                'nombre' => $sucursal->nombre,
            ],
            'warehouses' => $warehouses,
        ]);
    }

    /**
     * Display inventory for a specific warehouse (read-only).
     */
    public function show(Sucursal $sucursal, Warehouse $warehouse)
    {
        // Verificar que el almacén pertenece a la sucursal
        abort_unless($warehouse->branch_id === $sucursal->id, 403, 'Este almacén no pertenece a la sucursal especificada.');

        // Obtener inventario del almacén
        $inventory = $warehouse->warehouseProducts()
            ->with([
                'productBaseBranch.productBase' => function ($query) {
                    $query->select('id', 'name', 'sku_base');
                }
            ])
            ->orderBy('stock', 'desc')
            ->get()
            ->map(function ($warehouseProduct) {
                $productBase = $warehouseProduct->productBaseBranch?->productBase;
                $productBaseBranch = $warehouseProduct->productBaseBranch;

                return [
                    'id' => $warehouseProduct->id,
                    'product_name' => $productBase?->name ?? '[Producto eliminado]',
                    'sku' => $productBase?->sku_base ?? 'N/A',
                    'sale_type' => $productBaseBranch?->sale_type ?? 'unit',
                    'stock' => $warehouseProduct->stock,
                    'min_stock' => $warehouseProduct->min_stock,
                    'is_low_stock' => $warehouseProduct->min_stock 
                        ? $warehouseProduct->stock <= $warehouseProduct->min_stock 
                        : false,
                ];
            });

        return Inertia::render('sucursales/almacenes/Inventory', [
            'sucursal' => [
                'id' => $sucursal->id,
                'nombre' => $sucursal->nombre,
            ],
            'warehouse' => [
                'id' => $warehouse->id,
                'name' => $warehouse->name,
                'description' => $warehouse->description,
                'is_default' => $warehouse->is_default,
                'status' => $warehouse->status,
            ],
            'inventory' => $inventory,
        ]);
    }
}
