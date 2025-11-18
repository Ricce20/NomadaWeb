<?php

namespace App\Policies;

use App\Models\Sucursal;
use App\Models\User;

class SucursalPolicy
{
    /**
     * Determine if the user can view the sucursal.
     */
    public function view(User $user, Sucursal $sucursal): bool
    {
        return $user->canReadSucursal($sucursal);
    }

    /**
     * Determine if the user can manage products (price + stock) in the sucursal.
     */
    public function manage(User $user, Sucursal $sucursal): bool
    {
        // Super admin puede gestionar todas las sucursales
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Owner puede gestionar sus sucursales
        if ($user->ownsSucursal($sucursal)) {
            return true;
        }

        // Manager puede gestionar sucursales asignadas
        if ($user->managesSucursal($sucursal)) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can manage stock (only stock) in the sucursal.
     */
    public function stock(User $user, Sucursal $sucursal): bool
    {
        // Si puede manage, también puede stock
        if ($this->manage($user, $sucursal)) {
            return true;
        }

        // Warehouse puede gestionar stock
        if ($user->warehousesSucursal($sucursal)) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can view products in the sucursal.
     */
    public function viewProducts(User $user, Sucursal $sucursal): bool
    {
        return $this->view($user, $sucursal);
    }

    /**
     * Determine if the user can manage products in the sucursal.
     */
    public function manageProducts(User $user, Sucursal $sucursal): bool
    {
        return $this->manage($user, $sucursal);
    }

    /**
     * Determine if the user can create sucursales.
     */
    public function create(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isOwner();
    }

    /**
     * Determine if the user can update the sucursal.
     */
    public function update(User $user, Sucursal $sucursal): bool
    {
        return $this->manage($user, $sucursal);
    }

    /**
     * Determine if the user can delete the sucursal.
     */
    public function delete(User $user, Sucursal $sucursal): bool
    {
        // Solo owner puede eliminar sus sucursales
        if ($user->isOwner() && $user->ownsSucursal($sucursal)) {
            return true;
        }

        // Super admin puede eliminar cualquier sucursal
        if ($user->isSuperAdmin()) {
            return true;
        }

        return false;
    }
}
