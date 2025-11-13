<?php

namespace App\Http\Controllers\ownership;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Vehiculo;
use App\Models\Sucursal;

class VehiculoController extends Controller
{
    private function getNegocioId()
    {
        return auth()->user()->negocio()->pluck('id')->first();
    }


    public function index(Request $request, int|string $sucursalId):Response{
        $negocio = $this->getNegocioId();

        $sucursal = Sucursal::where('id',$sucursalId)->where('negocio_id',$negocio)->first();

        if(!$sucursal){
            return redirect()->back()->with(['error'=>'Accion no valida']);
        }

        $query = Vehiculo::query()->where('sucursal_id',$sucursal->id);


        // Filtros
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('modelo', 'like', "%{$search}%")
                    ->orWhere('placa', 'like', "%{$search}%");
            });
        }

        // Ordenamiento
        $sortField = $request->input('sort', 'marca');
        $sortDirection = $request->input('direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        // Filtro de eliminados (soft deletes)
        if ($request->trashed === 'with') {
            $query->withTrashed();
        } elseif ($request->trashed === 'only') {
            $query->onlyTrashed();
        }

        $vehiculos = $query->paginate()->withQueryString()->through(fn ($item) => [
            'id' => $item->id,
            'placa' => $item->placa,
            'marca' => $item->marca,
            'modelo' => $item->modelo,
            'color' => $item->color,
            'tipo' => $item->tipo,
            'kilometros_por_litro' => $item->kilometros_por_litro,
            'precio_litro_combustible' => $item->precio_litro_combustible,
            'capacidad_carga_kg' => $item->capacidad_carga_kg,
            'estado' => $item->estado,
            'created_at' => $item->created_at->format('d/m/Y'),
            'updated_at' => $item->updated_at->format('d/m/Y'),
            'deleted_at' => $item->deleted_at?->format('d/m/Y')
        ]);

        return Inertia::render('ownership/sucursales/partials/vehiculos',[
            'items' => $vehiculos,
            'sucursal' => $sucursal,
            'filters' => [
                'search' => $request->search,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'trashed' => $request->trashed,
            ],
        ]);

    }


    //store
    public function store(Request $request){
        $validated = $request->validate([
            'placa' => 'required|string|max:10|unique:vehiculos,placa',
            'marca' => 'required|string|max:50',
            'modelo' => 'required|string|max:50',
            'color' => 'nullable|string|max:30',
            'tipo' => 'required|in:camioneta,camion,pickup,furgoneta,trailer,van',
            'kilometros_por_litro' => 'nullable|numeric|min:0',
            'precio_litro_combustible' => 'nullable|numeric|min:0',
            'capacidad_carga_kg' => 'nullable|numeric|min:0',
            'estado' => 'required|in:activo,mantenimiento,inactivo',
            'sucursal_id' => 'required|exists:sucursales,id',
        ]);

        $negocio = $this->getNegocioId();

        $sucursal = Sucursal::where('negocio_id',$negocio)->where('id',$validated['sucursal_id'])->pluck('id')->first();
        if(!$sucursal){
            return redirect()->back()->with(['error'=>'Accion no valida']);
        }

        $vehiculo = Vehiculo::create($validated);

        return redirect()->back()->with(['success'=>'Vehiculo registrado correctamente']);

    }

    public function update(Request $request, int | string $id)
    {
        $negocio = $this->getNegocioId();
        $vehiculo = Vehiculo::find($id);

        if(!$vehiculo){
            return redirect()->back()->with(['error'=>'Accion no valida']);
        }

        $validated = $request->validate([
            'placa' => 'required|string|max:10|unique:vehiculos,placa,' . $vehiculo->id,
            'marca' => 'required|string|max:50',
            'modelo' => 'required|string|max:50',
            'color' => 'nullable|string|max:30',
            'tipo' => 'required|in:camioneta,camion,pickup,furgoneta,trailer,van',
            'kilometros_por_litro' => 'nullable|numeric|min:0',
            'precio_litro_combustible' => 'nullable|numeric|min:0',
            'capacidad_carga_kg' => 'nullable|numeric|min:0',
            'estado' => 'required|in:activo,mantenimiento,inactivo',
        ]);

        $sucursal = Sucursal::where('negocio_id',$negocio)->where('id',$vehiculo->sucursal_id)->pluck('id')->first();

        if(!$sucursal){
            return redirect()->back()->with(['error'=>'Accion no valida']);
        }

        $vehiculo->update($validated);

        return redirect()->back()->with(['success'=>'Vehiculo actualizado correctamente']);

    }

    /**
     * Eliminar un vehículo.
     */
    public function destroy(int | string $id)
    {
        $vehiculo = Vehiculo::find($id);

        if(!$vehiculo){
            return redirect()->back()->with(['error'=>'Accion no valida']);
        }

        $vehiculo->delete();

        return redirect()->back()->with(['success'=>'Vehiculo eliminado correctamente']);

    }
}
