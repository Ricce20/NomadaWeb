<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserManagesSucursal
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $sucursal = $request->route('sucursal');

        if (!$sucursal) {
            abort(404, 'Sucursal no encontrada.');
        }

        if (!$request->user()->can('manage', $sucursal)) {
            abort(403, 'No tienes permiso para gestionar esta sucursal.');
        }

        return $next($request);
    }
}
