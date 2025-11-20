<?php

namespace App\Services;

use App\Models\Warehouse;
use App\Models\ProductBaseBranch;
use App\Models\WarehouseProduct;
use App\Models\InventoryMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class InventoryService
{
    /**
     * Registra un movimiento de inventario en un almacén.
     * 
     * @param Warehouse $warehouse El almacén donde se realiza el movimiento
     * @param ProductBaseBranch $productBaseBranch El producto por sucursal
     * @param string $type Tipo de movimiento: 'in' (entrada), 'out' (salida), 'adjust' (ajuste)
     * @param int $quantity Cantidad del movimiento (siempre positiva)
     * @param User|null $user Usuario que realiza el movimiento
     * @param string|null $reason Razón o descripción del movimiento
     * 
     * @return InventoryMovement El movimiento registrado
     * 
     * @throws InvalidArgumentException Si el tipo de movimiento no es válido
     */
    public function registerMovement(
        Warehouse $warehouse,
        ProductBaseBranch $productBaseBranch,
        string $type,
        int $quantity,
        ?User $user = null,
        ?string $reason = null
    ): InventoryMovement {
        // Validar tipo de movimiento
        if (!in_array($type, ['in', 'out', 'adjust'])) {
            throw new InvalidArgumentException("Tipo de movimiento inválido: {$type}. Debe ser 'in', 'out' o 'adjust'.");
        }

        return DB::transaction(function () use ($warehouse, $productBaseBranch, $type, $quantity, $user, $reason) {
            // Obtener o crear el registro de producto en el almacén
            $warehouseProduct = WarehouseProduct::firstOrCreate(
                [
                    'warehouse_id' => $warehouse->id,
                    'product_base_branch_id' => $productBaseBranch->id,
                ],
                [
                    'stock' => 0,
                    'min_stock' => null,
                ]
            );

            // Guardar stock anterior
            $previousStock = $warehouseProduct->stock;

            // Calcular nuevo stock según el tipo de movimiento
            $newStock = match ($type) {
                'in' => $previousStock + $quantity,      // Entrada: suma
                'out' => $previousStock - $quantity,     // Salida: resta
                'adjust' => $quantity,                   // Ajuste: establece el valor exacto
            };

            // Actualizar stock en warehouse_products
            $warehouseProduct->stock = $newStock;
            $warehouseProduct->save();

            // Crear registro del movimiento
            $movement = InventoryMovement::create([
                'warehouse_id' => $warehouse->id,
                'product_base_branch_id' => $productBaseBranch->id,
                'type' => $type,
                'quantity' => $quantity,
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'reason' => $reason,
                'performed_by' => $user?->id,
            ]);

            return $movement;
        });
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
