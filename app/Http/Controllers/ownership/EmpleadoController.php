<?php

namespace App\Http\Controllers\ownership;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use Inertia\Inertia;
use Inertia\Response;
use App\Models\Empleado;
use App\Models\Sucursal;
use App\Models\SucursalEmpleado;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class EmpleadoController extends Controller
{
    //index
    public function index(Request $request,$sucursalId):Response{
       //obtenemos el negocio
        $negocioId = auth()->user()->negocio()->pluck('id')->first();
        //obtenemos la sucursal
        $sucursal = Sucursal::where('negocio_id',$negocioId)->where('id',$sucursalId)->first();

        if(!$sucursal){
            return redirect()->back()->with(['error' => 'Acceso no permitido']);
        }

        $query = Empleado::query();
        $query->where('sucursal_id',$sucursal->id);

        // Filtro opcional para ver registros eliminados
        if ($request->input('trashed') === 'only') {
            $query->onlyTrashed();
        } elseif ($request->input('trashed') === 'with') {
            $query->withTrashed();
        }
        // Por defecto solo muestra registros activos (sin onlyTrashed ni withTrashed)

        // Búsqueda opcional
        if ($request->has('search')) {
            $search = $request->input('search');
            // Agrupamos las condiciones OR para que no anulen las condiciones WHERE previas
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('apellidos', 'like', "%{$search}%");
            });
        }

         // Ordenamiento
        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        // Paginación
        $items = $query->paginate(10)
            ->withQueryString() // Mantiene los parámetros de búsqueda
            ->through(fn ($item) => [
                'id' => $item->id,
                'nombre' => $item->nombre,
                'apellidos' => $item->apellidos,
                'edad' => $item->edad,
                'activo' => $item->activo,
                'updated_at' => $item->updated_at->format('d/m/Y'),
                'telefono' => $item->telefono,
                'created_at' => $item->created_at->format('d/m/Y'),
                'deleted_at' => $item->deleted_at?->format('d/m/Y'),
                
            ]);

        $total = Empleado::where('negocio_id',$negocioId)->count();
        $tieneSucursales = auth()->user()->negocio()->exists();

        return Inertia::render('ownership/sucursales/partials/empleados', [
                'items' => $items,
                'filters' => $request->only(['search', 'trashed', 'sort', 'direction']),
                'hasSucursales' => $tieneSucursales,
                'total' => $total,
                'sucursal' => $sucursal
            ]);
    }

    public function store(Request $request){
        //validar
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'telefono' => 'required|string|max:12|unique:empleados',
            'edad' => 'required|string',
            'activo' => 'required|boolean',
            'sucursalId' => 'required|integer'
        ]);
       

        //id del negocio
        $negocioId = auth()->user()->negocio()->pluck('id')->first();


         //validar que el sucursal sea del negocio
        $sucursal = Sucursal::where('negocio_id',$negocioId)->where('id',$validated['sucursalId'])->first();

        if(!$sucursal){
            return redirect()->back()->with(['error' => 'No tiene permiso para realizar esta accion']);
        }

        //crear
        $empleado = Empleado::create(array_merge(['negocio_id'=> $negocioId,'sucursal_id' => $sucursal->id], $validated));


        return redirect()->back()->with('success','Empleado registrado correctamente');
    }

    public function update(Request $request, string | int $id) {

            $negocio = auth()->user()->negocio()->pluck('id')->first();
            $empleado = Empleado::where('id', $id)
            ->where('negocio_id', $negocio)
            ->firstOrFail();

            if(!$empleado){
                return redirect()->back()->with(['error' => 'Empleado no encontrado']);
            }

            $validated = $request->validate([
                'nombre' => 'required|string|max:255',
                'apellidos' => 'required|string|max:255',
                'telefono' => ['required', 'string', 'max:12', Rule::unique('empleados')->ignore($empleado->id)],
                'edad' => 'required|string',
                'activo' => 'required|boolean',
                'sucursal_id' => 'nullable|integer',

            ]);

            $sucursal = Sucursal::where('negocio_id',$negocio)->where('id',$validated['sucursal_id'])->first();

            if(!$sucursal){
                return redirect()->back()->with(['error' => 'Accion no autorizada']);
            }
            if($empleado->sucursal_id != $sucursal->id){
                return redirect()->back()->with(['error' => 'Accion no autorizada']);

            }

            $empleado->update($validated);
            
            return redirect()->back()->with('success', 'Empleado actualizado correctamente');
    }

    public function delete(string|int $id){
        $empleado = Empleado::find($id);
        if (! $empleado) {
            return redirect()->back()->with(['warning' => 'Empleado no encontrado']);
        }

        // Borrar empleado (soft o hard según tu modelo)
        $empleado->delete();
        return redirect()->back()->with(['success' => 'Se eliminó correctamente']);
    }
}
