<?php

namespace App\Services;

use App\Models\Warehouse;
use App\Models\ProductBaseBranch;
use App\Models\WarehouseProduct;
use App\Models\InventoryMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use App\Models\Almacen;
use App\Models\InventoryMovementDetail;
class InventoryService
{
    public function registerMovement(
        Almacen $warehouse,
        array $products, // Array de productos con sus cantidades y notas
        string $type,
        ?User $user = null,
        ?string $reason = null,
        string $status = 'pendiente',
        string|int $sucursal_id
    ): InventoryMovement {
        // Validar tipo de movimiento
        if (!in_array($type, ['in', 'adjust', 'out'])) {
            throw new InvalidArgumentException("Tipo de movimiento inválido: {$type}. Debe ser 'in', 'adjust' o 'out'.");
        }

        // Validar que hay al menos un producto
        if (empty($products)) {
            throw new InvalidArgumentException("Debe proporcionar al menos un producto para el movimiento.");
        }

        return DB::transaction(function () use ($warehouse, $products, $type, $user, $reason, $status,$sucursal_id) {
            // Generar número de movimiento único
            $movementNumber = $this->generateMovementNumber($type);
            
            // Crear cabecera del movimiento
            $movement = InventoryMovement::create([
                'movement_number' => $movementNumber,
                'almacen_id' => $warehouse->id,
                'sucursal_id' => $sucursal_id,
                'type' => $type,
                'reason' => $reason,
                'performed_by' => $user?->id,
                'status' => $status,
                'total_quantity' => 0, // Se calculará después
            ]);

            $totalQuantity = 0;

            // Procesar cada producto
            foreach ($products as $productData) {
                // Validar datos del producto
                if (empty($productData['product_base_branch_id']) || empty($productData['quantity'])) {
                    throw new InvalidArgumentException("Datos incompletos para uno de los productos.");
                }

                $productBaseBranch = ProductBaseBranch::find($productData['product_base_branch_id']);
                
                if (!$productBaseBranch) {
                    throw new InvalidArgumentException("Producto no encontrado: {$productData['product_base_branch_id']}");
                }

                $quantity = (int) $productData['quantity'];
                $notes = $productData['notes'] ?? null;

                // Validar cantidad
                if ($quantity <= 0) {
                    throw new InvalidArgumentException("La cantidad debe ser mayor a 0 para el producto: {$productBaseBranch->productBase->name}");
                }

                // Obtener o crear el registro de producto en el almacén
                $warehouseProduct = WarehouseProduct::firstOrCreate(
                    [
                        'almacen_id' => $warehouse->id,
                        'product_base_branch_id' => $productBaseBranch->id,
                    ],
                    [
                        'stock' => 0,
                        // 'min_stock' => null,
                    ]
                );

                // Guardar stock anterior
                $previousStock = $warehouseProduct->stock;

                // Calcular nuevo stock según el tipo de movimiento
                $newStock = match ($type) {
                    'in' => $previousStock + $quantity,      // Entrada: suma
                    'adjust' => $quantity,                   // Ajuste: establece el valor exacto
                    'out' => $previousStock - $quantity,     // Salida: resta
                };

                // Validar que no haya stock negativo
                if ($newStock < 0) {
                    throw new InvalidArgumentException(
                        "No hay suficiente stock para {$productBaseBranch->productBase->name}. " .
                        "Stock disponible: {$previousStock}, cantidad solicitada: {$quantity}"
                    );
                }

                // Solo actualizar stock físico si el movimiento está completado
                if ($status === 'completado') {
                    $warehouseProduct->stock = $newStock;
                    $warehouseProduct->save();

                    // Sincronizar stock general de la sucursal
                    $productBaseBranch->recalculateStockFromWarehouses();
                }

                // Crear detalle del movimiento
                InventoryMovementDetail::create([
                    'inventory_movement_id' => $movement->id,
                    'product_base_branch_id' => $productBaseBranch->id,
                    'quantity' => $quantity,
                    'previous_stock' => $previousStock,
                    'new_stock' => $status === 'completado' ? $newStock : $previousStock,
                    'notes' => $notes,
                ]);

                $totalQuantity += $quantity;
            }

            // Actualizar cantidad total en la cabecera
            $movement->update(['total_quantity' => $totalQuantity]);

            return $movement;
        });
    }

    /**
     * Genera un número único para el movimiento
     */
    protected function generateMovementNumber(string $type): string
    {
        $prefix = match($type) {
            'in' => 'ENT',
            'out' => 'SAL',
            'adjust' => 'AJT',
            default => 'MOV'
        };

        $date = now()->format('Ymd');
        
        // Contar movimientos del día
        $count = InventoryMovement::whereDate('created_at', today())->count() + 1;
        
        return "{$prefix}-{$date}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Actualiza el estado de un movimiento existente
     */
    public function updateMovementStatus(InventoryMovement $movement, string $status, ?User $user = null): InventoryMovement
    {
        // Validaciones de estado
        $validTransitions = [
            'pendiente' => ['completado', 'cancelado'],
            'completado' => ['cancelado'],
            'cancelado' => ['pendiente'],
        ];

        if (!in_array($status, $validTransitions[$movement->status] ?? [])) {
            throw new InvalidArgumentException(
                "Transición de estado no válida: {$movement->status} → {$status}"
            );
        }

        return DB::transaction(function () use ($movement, $status, $user) {
            $oldStatus = $movement->status;
            $movement->status = $status;

            // Si se está completando un movimiento pendiente, aplicar los cambios de stock
            if ($status === 'completado' && $oldStatus === 'pendiente') {
                $this->applyMovementStock($movement);
                // $movement->approved_by = $user?->id;
            }

            // Si se está cancelando un movimiento completado, revertir los cambios de stock
            if ($status === 'cancelado' && $oldStatus === 'completado') {
                $this->revertMovementStock($movement);
            }

            // Si se está reactivando un movimiento cancelado, quitar approved_by
            if ($status === 'pendiente' && $oldStatus === 'cancelado') {
                // $movement->approved_by = null;
            }

            $movement->save();

            return $movement;
        });
    }

    /**
     * Aplica los cambios de stock de un movimiento
     */
    protected function applyMovementStock(InventoryMovement $movement): void
    {
        foreach ($movement->details as $detail) {

            $warehouseProduct = WarehouseProduct::where([
                'almacen_id' => $movement->almacen_id,
                'product_base_branch_id' => $detail->product_base_branch_id,
            ])->first();

            if (!$warehouseProduct) {
                throw new InvalidArgumentException("No existe registro de stock para este producto.");
            }

            // ⚠ VALIDACIÓN NUEVA ANTES DE MODIFICAR STOCK
            if ($movement->type === 'out') {
                if ($warehouseProduct->stock < $detail->quantity) {
                    throw new InvalidArgumentException(
                        "No es posible confirmar el movimiento. Stock insuficiente para "
                        . $detail->productBaseBranch->productBase->name
                        . ". Disponible: {$warehouseProduct->stock}, requerido: {$detail->quantity}"
                    );
                }
            }

            // 🧮 Calcular el nuevo stock después de validar
            $newStock = match ($movement->type) {
                'in' => $detail->previous_stock + $detail->quantity,
                'out' => $warehouseProduct->stock - $detail->quantity,
                'adjust' => $detail->quantity,
                default => $detail->previous_stock
            };

            $warehouseProduct->stock = $newStock;
            $warehouseProduct->save();

            $detail->new_stock = $newStock;
            $detail->save();

            // Sincronizar stock general
            $detail->productBaseBranch->recalculateStockFromWarehouses();
        }
    }


    /**
     * Revierte los cambios de stock de un movimiento
     */
    protected function revertMovementStock(InventoryMovement $movement): void
    {
        foreach ($movement->details as $detail) {
            $warehouseProduct = WarehouseProduct::where([
                'almacen_id' => $movement->almacen_id,
                'product_base_branch_id' => $detail->product_base_branch_id,
            ])->first();

            if ($warehouseProduct) {
                // Revertir al stock anterior
                $warehouseProduct->stock = $detail->previous_stock;
                $warehouseProduct->save();

                // Restaurar el nuevo stock en el detalle
                $detail->new_stock = $detail->previous_stock;
                $detail->save();

                // Sincronizar stock general de la sucursal
                $detail->productBaseBranch->recalculateStockFromWarehouses();
            }
        }
    }

    /**
     * Obtiene el stock actual de un producto en un almacén específico.
     * 
     * @param Warehouse $warehouse
     * @param ProductBaseBranch $productBaseBranch
     * @return int Stock actual (0 si no existe el registro)
     */
    public function getStock(Warehouse $warehouse, ProductBaseBranch $productBaseBranch): int
    {
        $warehouseProduct = WarehouseProduct::where('warehouse_id', $warehouse->id)
            ->where('product_base_branch_id', $productBaseBranch->id)
            ->first();

        return $warehouseProduct?->stock ?? 0;
    }

    /**
     * Obtiene el historial de movimientos de un producto en un almacén.
     * 
     * @param Warehouse $warehouse
     * @param ProductBaseBranch $productBaseBranch
     * @param int $limit Límite de registros a retornar
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getMovementHistory(
        Warehouse $warehouse,
        ProductBaseBranch $productBaseBranch,
        int $limit = 50
    ) {
        return InventoryMovement::where('warehouse_id', $warehouse->id)
            ->where('product_base_branch_id', $productBaseBranch->id)
            ->with('performedBy')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
