<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Almacen extends Model
{
    use SoftDeletes;
    protected $table = "almacenes";

    protected $fillable = [
        'nombre',
        'descripcion',
        'activo',
        'sucursal_id',
        'ubicacion'
    ];


    public function sucursal(){
        return $this->belongsTo(Sucursal::class);
    }

     /**
     * Relación con los productos del almacén
     */
    public function warehouseProducts()
    {
        return $this->hasMany(WarehouseProduct::class);
    }

    /**
     * Relación con los movimientos de inventario
     */
    public function inventoryMovements()
    {
        return $this->hasMany(InventoryMovement::class);
    }
}
