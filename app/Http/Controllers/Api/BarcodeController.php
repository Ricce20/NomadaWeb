<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductBarcode;
use App\Models\ProductBaseBranch;
use Illuminate\Http\Request;

class BarcodeController extends Controller
{
    /**
     * Buscar producto por código de barras
     */
    public function search(Request $request)
    {
        $request->validate([
            'barcode' => 'required|string',
            'sucursal_id' => 'required|integer|exists:sucursales,id',
            'warehouse_id' => 'nullable|integer|exists:almacenes,id',
        ]);

        $user = auth()->user();
        $sucursalId = $request->sucursal_id;
        $warehouseId = $request->warehouse_id;

        // Verificar acceso a la sucursal
        $hasAccess = $user->sucursales()->where('sucursales.id', $sucursalId)->exists();
        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a esta sucursal'
            ], 403);
        }

        // Buscar el código de barras
        $barcodeRecord = ProductBarcode::where('barcode', $request->barcode)->first();

        if (!$barcodeRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Código de barras no encontrado'
            ], 404);
        }

        // Buscar el producto en la sucursal
        $productBranch = ProductBaseBranch::where('product_base_id', $barcodeRecord->product_base_id)
            ->where('branch_id', $sucursalId)
            ->with([
                'productBase' => function ($q) {
                    $q->select('id', 'sku_base', 'name', 'brand_id', 'category_id', 'uom_id', 'description')
                        ->with(['brand:id,name', 'category:id,name', 'uom:id,name,abbreviation']);
                },
                'warehouseProducts' => function ($q) use ($sucursalId, $warehouseId) {
                    $q->whereHas('warehouse', function ($wq) use ($sucursalId) {
                        $wq->where('sucursal_id', $sucursalId);
                    });
                    if ($warehouseId) {
                        $q->where('almacen_id', $warehouseId);
                    }
                    $q->select('id', 'almacen_id', 'product_base_branch_id', 'stock')
                        ->with('warehouse:id,nombre,sucursal_id');
                }
            ])
            ->first();

        if (!$productBranch) {
            return response()->json([
                'success' => false,
                'message' => 'Este producto no está disponible en tu sucursal'
            ], 404);
        }

        $productBase = $productBranch->productBase;
        $currentStock = $productBranch->warehouseProducts->sum('stock');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $productBranch->id,
                'product_base_id' => $productBranch->product_base_id,
                'nombre' => $productBase->name,
                'descripcion' => $productBase->description ?? '',
                'sku' => $productBase->sku_base,
                'unidad_medida' => $productBase->uom->abbreviation ?? $productBase->uom->name ?? 'UND',
                'precio' => (float) $productBranch->price,
                'imagen_url' => $productBranch->image_path ? asset('storage/' . $productBranch->image_path) : null,
                'marca' => $productBase->brand->name ?? null,
                'categoria' => $productBase->category->name ?? null,
                'sale_type' => $productBranch->sale_type,
                'current_stock' => (float) $currentStock,
                'barcode' => $request->barcode,
            ]
        ]);
    }

    /**
     * Asociar código de barras a un producto
     */
    public function store(Request $request)
    {
        $request->validate([
            'barcode' => 'required|string|unique:product_barcodes,barcode',
            'product_base_id' => 'required|integer|exists:product_bases,id',
            'type' => 'nullable|string|in:EAN-13,EAN-8,UPC-A,UPC-E,CODE-128,CODE-39,QR',
        ]);

        $barcode = ProductBarcode::create([
            'barcode' => $request->barcode,
            'product_base_id' => $request->product_base_id,
            'type' => $request->type ?? 'EAN-13',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Código de barras registrado correctamente',
            'data' => $barcode
        ]);
    }
}
