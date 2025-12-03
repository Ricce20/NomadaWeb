<?php

namespace App\Http\Controllers\ownership;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Sucursal;
use App\Models\SucursalUsuario;
use App\Models\Negocio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Empleado;
class UserController extends Controller
{
    /**
     * Obtener el ID del negocio del usuario autenticado
     */
    private function getNegocioId()
    {
        return auth()->user()->negocio()->pluck('id')->first();
    }

    /**
     * Obtener las sucursales del negocio
     */
    private function getSucursales()
    {
        $negocioId = $this->getNegocioId();
        return Sucursal::where('business_id', $negocioId)->get();
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, string | int $sucursalId)
    {
        $negocioId = $this->getNegocioId();

        // Verificar que la sucursal pertenece al negocio del usuario
        $sucursal = Sucursal::where('id', $sucursalId)
            ->where('negocio_id', $negocioId)
            ->firstOrFail();

        // Obtener los usuarios de la sucursal con filtros
        $query = User::query()
            ->select('users.*')
            ->join('sucursal_usuarios', 'users.id', '=', 'sucursal_usuarios.user_id')
            ->where('sucursal_usuarios.sucursal_id', $sucursalId);

        // Filtros
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('users.name', 'like', "%{$search}%")
                    ->orWhere('users.username', 'like', "%{$search}%");
            });
        }

        // Ordenamiento
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $query->orderBy("users.{$sortField}", $sortDirection);

        // Filtro de eliminados (soft deletes)
        if ($request->trashed === 'with') {
            $query->withTrashed();
        } elseif ($request->trashed === 'only') {
            $query->onlyTrashed();
        }

        $usuarios = $query->paginate(10)->withQueryString()->through(fn($item)=>[
            'id' => $item->id,
            'name' => $item->name,
            'username' => $item->username,
            'type' => $item->type,
            'deleted_at' => $item->deleted_at?->format('d/m/Y'),
            'created_at' => $item->created_at->format('d/m/Y'),
            'updated_at' => $item->updated_at->format('d/m/Y')
        ]);

        //enviamos datos de empleados

        return Inertia::render('ownership/sucursales/partials/usuarios', [
            'sucursal' => $sucursal,
            'items' => $usuarios,
            'filters' => [
                'search' => $request->search,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'trashed' => $request->trashed,
            ],
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255',
            'password' => ['required', 'confirmed', Password::defaults()],
            'type' => 'required|in:manager,warehouse_man,driver',
            'sucursal_id'=> 'required|integer'
        ]);
        
        $negocioId = $this->getNegocioId();

        if(!$negocioId){
            return redirect()->back()->withErrors(['error' => 'Negocio no encontrado']);
        }

        $negocio = Negocio::find($negocioId);
        if(!$negocio){
            return redirect()->back()->withErrors(['error' => 'Negocio no encontrado']);
        }

        // Verificar que la sucursal pertenece al negocio
        $sucursal = Sucursal::where('id', $validated['sucursal_id'])
            ->where('negocio_id', $negocioId)
            ->first();

        if(!$sucursal){
            return redirect()->back()->withErrors(['error' => 'Sucursal no encontrada']);
        }

        // Generar prefix del negocio y concatenarlo al username
        $prefix = User::generateBusinessPrefix($negocioId);
        $username = "{$prefix}_{$validated['username']}";

        // Verificar que el username completo no exista
        if (User::where('username', $username)->exists()) {
            return redirect()->back()->withErrors(['username' => 'Este nombre de usuario ya está en uso. Por favor elige otro.']);
        }

        // Crear el usuario
        $usuario = User::create([
            'name' => $validated['name'],
            'username' => $username,
            'password' => Hash::make($validated['password']),
            'type' => $validated['type'],
        ]);

        // Asignar el usuario a la sucursal
        SucursalUsuario::create([
            'sucursal_id' => $validated['sucursal_id'],
            'user_id' => $usuario->id,
        ]);

        return redirect()->back()
            ->with(['success'=>'Usuario creado exitosamente']);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request,string | int $usuarioId)
    {

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => "required|string|max:255|unique:users,username,{$usuarioId}",
            'type' => 'required|in:manager,warehouse_man,cashier',
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'sucursal_id' =>'required|integer'
        ]);

        $negocioId = $this->getNegocioId();

        // Verificar que la sucursal pertenece al negocio
        $sucursal = Sucursal::where('id', $validated['sucursal_id'])
            ->where('negocio_id', $negocioId)
            ->firstOrFail();

        // Obtener el usuario
        $usuario = User::select('users.*')
            ->join('sucursal_usuarios', 'users.id', '=', 'sucursal_usuarios.user_id')
            ->where('sucursal_usuarios.sucursal_id', $sucursal->id)
            ->where('users.id', $usuarioId)
            ->firstOrFail();

        // Actualizar datos del usuario
        $dataToUpdate = [
            'name' => $validated['name'],
            'username' => $validated['username'],
            'type' => $validated['type'],
        ];

        // Solo actualizar la contraseña si se proporcionó una nueva
        if (!empty($validated['password'])) {
            $dataToUpdate['password'] = Hash::make($validated['password']);
        }

        $usuario->update($dataToUpdate);

        return redirect()
            ->back()
            ->with(['success' => 'Usuario actualizado exitosamente']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($sucursalId, $usuarioId)
    {
        $negocioId = $this->getNegocioId();

        // Verificar que la sucursal pertenece al negocio
        $sucursal = Sucursal::where('id', $sucursalId)
            ->where('business_id', $negocioId)
            ->firstOrFail();

        // Obtener el usuario
        $usuario = User::select('usuarios.*')
            ->join('sucursal_usuarios', 'usuarios.id', '=', 'sucursal_usuarios.usuario_id')
            ->where('sucursal_usuarios.sucursal_id', $sucursalId)
            ->where('usuarios.id', $usuarioId)
            ->firstOrFail();

        // Eliminar la relación sucursal-usuario
        SucursalUsuario::where('sucursal_id', $sucursalId)
            ->where('usuario_id', $usuarioId)
            ->delete();

        // Soft delete del usuario (si no está en otras sucursales)
        $otrasRelaciones = SucursalUsuario::where('usuario_id', $usuarioId)->count();
        if ($otrasRelaciones === 0) {
            $usuario->delete();
        }

        return redirect()
            ->route('ownership.sucursales.usuarios.index', $sucursalId)
            ->with('success', 'Usuario eliminado exitosamente');
    }

    /**
     * Restaurar un usuario eliminado
     */
    public function restore($sucursalId, $usuarioId)
    {
        $negocioId = $this->getNegocioId();

        // Verificar que la sucursal pertenece al negocio
        $sucursal = Sucursal::where('id', $sucursalId)
            ->where('business_id', $negocioId)
            ->firstOrFail();

        $usuario = User::onlyTrashed()->findOrFail($usuarioId);
        $usuario->restore();

        // Restaurar la relación si fue eliminada
        SucursalUsuario::withTrashed()
            ->where('sucursal_id', $sucursalId)
            ->where('usuario_id', $usuarioId)
            ->restore();

        return redirect()
            ->route('ownership.sucursales.usuarios.index', $sucursalId)
            ->with('success', 'Usuario restaurado exitosamente');
    }
}