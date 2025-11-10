<?php

namespace App\Http\Controllers\ownership;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Almacen;
use App\Models\Sucursal;

class AlmacenController extends Controller
{
    private function getNegocioId()
    {
        return auth()->user()->negocio()->pluck('id')->first();
    }

    //index
    public function index(Request $request, int|string $sucursalId){

        $negocio = $this->getNegocioId();

        $sucursal = Sucursal::where('id',$sucursalId)->where('negocio_id',$negocio)->first();

        if(!$sucursal){
            return redirect()->back()->with(['error'=>'Accion no valida']);
        }
        //consulta
        $query = Almacen::query()->where('sucursal_id',$sucursal->id);

        // Filtros
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('ubicacion', 'like', "%{$search}%");
            });
        }

        // Ordenamiento
        $sortField = $request->input('sort', 'nombre');
        $sortDirection = $request->input('direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        // Filtro de eliminados (soft deletes)
        if ($request->trashed === 'with') {
            $query->withTrashed();
        } elseif ($request->trashed === 'only') {
            $query->onlyTrashed();
        }

        //get
        $almacenes = $query->paginate(10)->withQueryString()->through(fn($item)=>[
            'id' => $item->id,
            'nombre' => $item->nombre,
            'descripcion' => $item->descripcion,
            'ubicacion' => $item->ubicacion,
            'activo' => $item->activo,
            'deleted_at' => $item->deleted_at?->format('d/m/Y'),
            'updated_at' => $item->updated_at->format('d/m/Y'),
            'created_at' => $item->created_at->format('d/m/Y')
        ]);

        return Inertia::render('ownership/sucursales/partials/almacenes',[
            'items' => $almacenes,
            'sucursal' => $sucursal,
            'filters' => [
                'search' => $request->search,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'trashed' => $request->trashed,
            ],
        ]);
    }


    public function store(Request $request){
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'ubicacion' => 'required|string|max:255',
            'sucursal_id' => 'required|exists:sucursales,id',
            'activo' => 'required|boolean'

        ]);

        $negocio = $this->getNegocioId();

        $sucursal = Sucursal::where('negocio_id',$negocio)->where('id',$validated['sucursal_id'])->pluck('id')->first();
        if(!$sucursal){
            return redirect()->back()->with(['error'=>'Accion no valida']);
        }

        Almacen::create($validated);
        return redirect()->back()->with(['success'=>'Almacen registrado correctamente']);

    }

    public function update(Request $request,int|string $id){
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'ubicacion' => 'required|string|max:255',
            'activo' => 'required|boolean'
        ]);

        $negocio = $this->getNegocioId();

        $almacen = Almacen::find($id);

        if(!$almacen){
            return redirect()->back()->with(['error'=>'Accion no valida']);
        }


        $sucursal = Sucursal::where('negocio_id',$negocio)->where('id',$almacen->sucursal_id)->pluck('id')->first();

        if(!$sucursal){
            return redirect()->back()->with(['error'=>'Accion no valida']);
        }
        $almacen->update($validated);

        return redirect()->back()->with(['success'=>'Almacen actualizado correctamente']);

    }

     public function delete(int|string $id)
    {
        $almacen = Almacen::find($id);
        if(!$almacen){
            return redirect()->back()->with(['error'=>'Accion no valida']);
        }
        $almacen->delete();

        return redirect()->back()
            ->with('success', 'Almacén eliminado exitosamente.');
    }
}
