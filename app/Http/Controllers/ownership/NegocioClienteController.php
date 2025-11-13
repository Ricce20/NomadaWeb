<?php

namespace App\Http\Controllers\ownership;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\NegocioCliente;
use App\Models\Sucursal;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NegocioClienteController extends Controller
{
    private function getNegocioId():string|int{
        return auth()->user()->negocio()->pluck('id')->first();
    }

    //index
    public function index(Request $request){
        //obtenemos el negocio
        $negocioId = auth()->user()->negocio()->pluck('id')->first();

        $query = NegocioCliente::query()->where('negocio_id',$negocioId);
        
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
                  ->orWhere('apellidos', 'like', "%{$search}%")
                  ->orWhere('telefono','like',"%{$search}%");
            });
        }

         // Ordenamiento
        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $items = $query->paginate(15)
            ->withQueryString()
            ->through(fn($item) => [
                'id' => $item->id,
                'nombre' => $item->nombre,
                'apellidos' => $item->apellidos,
                'telefono' => $item->telefono,
                'fecha_registro' => $item->fecha_registro,
                'activo' => $item->activo,
                'created_at' => $item->created_at->format('d/m/Y'),
                'updated_at' => $item->updated_at->format('d/m/Y'),
                'deleted_at' => $item->deleted_at?->format('d/m/Y')
            ]);

        return Inertia::render('ownership/clientes/index', [
                'items' => $items,
                'filters' => $request->only(['search', 'trashed', 'sort', 'direction']),
            ]);

    }


    //store
    public function store(Request $request)
    {

        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'telefono' => 'required|string|max:12|unique:negocio_clientes',
            'activo' => 'required|boolean'            
        ]);

        $negocioId = $this->getNegocioId();
        $code = "";
        do{
            $code = Str::random(10);

        }while(NegocioCliente::where('codigo_cliente',$code)->exists());

        $add = [
            'fecha_registro' => now(),
            'activo' => true,
            'negocio_id' => $negocioId,
            'codigo_cliente' => $code
        ];

        NegocioCliente::create(array_merge($validated,$add));

        return redirect()->back()->with(['success','Cliente registrado correctamente']);


    }
    //update

    public function update(Request $request,int | string $id){
        $cliente = NegocioCliente::find($id);

        if(!$cliente){
            return redirect()->back()->with(['error'=>'Accion no permitida']);
        }

        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'telefono' => ['required', 'string', 'max:12', Rule::unique('negocio_clientes')->ignore($cliente->id)],
            'activo' => 'required|boolean'            

        ]);

        $cliente->update($validated);
        return redirect()->back()->with(['success' => 'Cliente actualizado correctamente']);

    }

    //delete

    public function delete(string|int $id){
        $cliente = NegocioCliente::find($id);
        if(!$cliente){
            return redirect()->back()->with(['error'=>'Accion no permitida']);
        }
        $cliente->update(['activo'=> false]);
        $cliente->delete();

        return redirect()->back()->with(['success' => 'Cliente eliminado correctamente']);
        
    }
}
