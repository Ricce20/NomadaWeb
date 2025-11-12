<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();
        if (!$user) { abort(401); }

        // Soporte por tipo simple: super_admin, owner, manager, employee
        $type = method_exists($user, 'type') ? $user->type : ($user->type ?? null);
        if ($type && in_array($type, $roles, true)) {
            return $next($request);
        }

        // Si usas tabla roles, agrega aquí una verificación por relación.
        abort(403);
    }
}
