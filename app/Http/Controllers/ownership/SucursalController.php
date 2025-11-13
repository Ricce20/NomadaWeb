<?php

namespace App\Http\Controllers\ownership;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Sucursal;

class SucursalController extends Controller
{
    //index
    public function index():Response
    {
        $negocio = auth()->user()->negocio()->first();
        $totalSucursales = $negocio->sucursales()->count() ?? 0;
        $sucursalesActivas = $negocio->sucursales()->where('activo', true)->count();
        $sucursalesInactivas = $negocio->sucursales()->where('activo', false)->count();

        $sucursales = $negocio->sucursales()->select(
            'id',
            'nombre',
            'direccion_completa',
            'telefono',
            'activo',
            'horarios',
            'codigo_postal',
            'updated_at',
            
        )->get()->toArray();
        // dd($sucursales);

        return Inertia::render('ownership/sucursales/index', [
            'totalSucursales' => $totalSucursales,
            'sucursalesActivas' => $sucursalesActivas,
            'sucursalesInactivas' => $sucursalesInactivas,
            'sucursalesData' => $sucursales,
        ]);
    }

    public function view(string|int $id){
        $negocio = auth()->user()->negocio()->first();

        $sucursal =  Sucursal::where('negocio_id',$negocio->id)->where('id',$id)->first();

        if(!$sucursal){
            return redirect()->back()->with(['error' => 'Accion no permitida']);
        }

        return Inertia::render('ownership/sucursales/view',[
            'sucursal' => $sucursal
        ]);

    }
    //create
    public function create(Request $request)
    {
        return Inertia::render('ownership/sucursales/create',[
            'isEdit' => false,
            'sucursal' => null
        ]);
    }

    public function store(Request $request)
    {
        // Validar los datos
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'direccion_completa' => 'required|string|max:500',
            'telefono' => 'required|string|max:10|unique:sucursales',
            'horarios' => 'required|array',
            'codigo_postal' => 'required|string|max:5',
            'activo' => 'required|boolean',
        ]);

        // Modificar el nombre para incluir el del negocio
        $nombreNegocio = auth()->user()->negocio()->first()->nombre;
        $nombreCompleto = $nombreNegocio . ' - ' . $validated['nombre'];

        // Verificar si ya existe una sucursal con ese nombre
        if (Sucursal::where('nombre', $nombreCompleto)
            ->where('negocio_id', auth()->user()->negocio()->first()->id)
            ->exists()) {
            return redirect()->back()
                ->withInput() // Mantiene los datos del formulario
                ->with('error', 'Ya existe una sucursal con ese nombre en tu negocio.');
        }

        $sucursal = new Sucursal();
        $sucursal->nombre = $nombreCompleto;
        $sucursal->direccion_completa = $validated['direccion_completa'];
        $sucursal->telefono = $validated['telefono'];
        $sucursal->horarios = $validated['horarios'];
        $sucursal->codigo_postal = $validated['codigo_postal'];
        $sucursal->activo = $validated['activo'];
        $sucursal->negocio_id = auth()->user()->negocio()->first()->id;
        $sucursal->save();

        return redirect()->back()
            ->with('success', 'Sucursal creada exitosamente.');
    }

    //edit
    public function edit(string|int $id)
    {
        $sucursal = Sucursal::find($id);
        // Verificar que la sucursal pertenezca al negocio del usuario
        $negocio = auth()->user()->negocio()->first();
        
        if ($sucursal->negocio_id !== $negocio->id) {
            abort(403, 'No tienes permiso para editar esta sucursal.');
        }

        return Inertia::render('ownership/sucursales/create', [
            'isEdit' => true,
            'sucursal' => $sucursal->only([
                'id',
                'nombre',
                'direccion_completa',
                'telefono',
                'horarios',
                'codigo_postal',
                'activo'
            ]),
        ]);
    }

    //update
    public function update(Request $request, string|int $id)
    {
        $sucursal = Sucursal::find($id);
        // Verificar que la sucursal pertenezca al negocio del usuario
        $negocio = auth()->user()->negocio()->first();
        
        if ($sucursal->negocio_id !== $negocio->id) {
            return redirect()->back()->with(['warning' => 'No tienes permiso para actualizar esta sucursal.']);
            
        }

        // Validar los datos
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'direccion_completa' => 'required|string|max:500',
            'telefono' => 'required|string|max:10',
            'horarios' => 'required|array',
            'codigo_postal' => 'required|string|max:5',
            'activo' => 'required|boolean',
        ]);

        // Modificar el nombre para incluir el del negocio
        $nombreCompleto = $negocio->nombre . ' - ' . $validated['nombre'];

        // Verificar si ya existe otra sucursal con ese nombre (excluyendo la actual)
        if (Sucursal::where('nombre', $nombreCompleto)
            ->where('negocio_id', $negocio->id)
            ->where('id', '!=', $sucursal->id)
            ->exists()) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'Ya existe otra sucursal con ese nombre en tu negocio.');
        }

        $sucursal->nombre = $nombreCompleto;
        $sucursal->direccion_completa = $validated['direccion_completa'];
        $sucursal->telefono = $validated['telefono'];
        $sucursal->horarios = $validated['horarios'];
        $sucursal->codigo_postal = $validated['codigo_postal'];
        $sucursal->activo = $validated['activo'];
        $sucursal->save();

        return redirect()->back()
            ->with('success', 'Sucursal actualizada exitosamente.');
    }

    public function delete(string| int $id){
        $sucursal = Sucursal::find($id);
        if(!$sucursal){
            return redirect()->back()->with(['info' => 'No se encontro la sucursal a eliminar']);
        }
        $sucursal->delete();
        return redirect()->back()->with(['success' => 'Sucursal eliminado conrrectamente']);
    }

 
}
