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

    public function verInventario(int|string $sucursalId ,int|string $almacenId){
        //obtenemos el almacen
        $almacen = Almacen::find($almacenId);
        if(!$almacen){
            return redirect()->back()->with(['error'=>'Accion no valida']);
        }
        //obtenemos 
        $sucursal = Sucursal::where('negocio_id',$this->getNegocioId(),)->where('id',$sucursalId)->first();
            
        if(!$sucursal){
            return redirect()->back()->with(['error'=>'Accion no valida']);
        }
        $inventory = $almacen->warehouseProducts()
            ->with([
                'productBaseBranch.productBase' => function ($query) {
                    $query->select('id', 'name', 'sku_base');
                }
            ])
            ->orderBy('stock', 'desc')
            ->get()
            ->map(function ($warehouseProduct) {
                $productBase = $warehouseProduct->productBaseBranch?->productBase;
                $productBaseBranch = $warehouseProduct->productBaseBranch;

                return [
                    'id' => $warehouseProduct->id,
                    'product_name' => $productBase?->name ?? '[Producto eliminado]',
                    'sku' => $productBase?->sku_base ?? 'N/A',
                    'sale_type' => $productBaseBranch?->sale_type ?? 'unit',
                    'stock' => $warehouseProduct->stock,
                    'min_stock' => $warehouseProduct->min_stock,
                    'is_low_stock' => $warehouseProduct->min_stock 
                        ? $warehouseProduct->stock <= $warehouseProduct->min_stock 
                        : false,
                ];
            });
        return Inertia::render('sucursales/almacenes/Inventory',[
            'sucursal' => [
                'id' => $sucursal->id,
                'nombre' => $sucursal->nombre,
            ],
            'almacen' => [
                'id' => $almacen->id,
                'nombre' => $almacen->nombre,
                'descripcion' => $almacen->descripcion,
                'ubicacion' => $almacen->ubicacion,
                'activo' => $almacen->activo,
            ],
            'inventory' => $inventory,
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

        // Crear en tabla almacenes (sistema antiguo)
        $almacen = Almacen::create($validated);

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


    public function obtenerAlmacenesPorSucursal(Request $request): Response
    {
            $user = auth()->user();

            // Obtener el empleado y su sucursal asociada
            $sucursalId = auth()->user()->sucursales()->pluck('sucursales.id')->first();

            $sucursal = Sucursal::find($sucursalId);
            if (!$sucursal) {
                return redirect()->back()->with(['error' => 'Accion no valida']);
            }

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

            return Inertia::render('empleados/almacen/index',[
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

   public function verInventarioParaEmpleado(int|string $almacenId)
    {
        // Obtenemos el almacen
        $almacen = Almacen::find($almacenId);
        if (!$almacen) {
            return redirect()->back()->with(['error' => 'Accion no valida']);
        }

        // Obtenemos la sucursal
        $sucursalId = auth()->user()->sucursales()->pluck('sucursales.id')->first();
        $sucursal = Sucursal::where('id', $sucursalId)->first();
        if (!$sucursal) {
            return redirect()->back()->with(['error' => 'Accion no valida']);
        }

        // Parámetros de búsqueda y paginación
        $search = request()->input('search', '');
        $perPage = request()->input('perPage', 15);
        $sortBy = request()->input('sortBy', 'stock');
        $sortDirection = request()->input('sortDirection', 'desc');

        // Construimos la consulta - CORREGIDO con nombres reales de tablas
        $query = $almacen->warehouseProducts()
            ->with([
                'productBaseBranch.productBase' => function ($query) {
                    $query->select('id', 'name', 'sku_base');
                }
            ]);

        // Aplicar búsqueda si existe
        if (!empty($search)) {
            $query->whereHas('productBaseBranch.productBase', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                ->orWhere('sku_base', 'like', "%{$search}%");
            });
        }

        // Aplicar ordenamiento - CORREGIDO con nombres reales de tablas
        if ($sortBy === 'product_name') {
            $query->join('product_base_branch', 'almacen_productos.product_base_branch_id', '=', 'product_base_branch.id')
                ->join('product_bases', 'product_base_branch.product_base_id', '=', 'product_bases.id')
                ->orderBy('product_bases.name', $sortDirection)
                ->select('almacen_productos.*');
        } elseif ($sortBy === 'sku') {
            $query->join('product_base_branch', 'almacen_productos.product_base_branch_id', '=', 'product_base_branch.id')
                ->join('product_bases', 'product_base_branch.product_base_id', '=', 'product_bases.id')
                ->orderBy('product_bases.sku_base', $sortDirection)
                ->select('almacen_productos.*');
        } else {
            $query->orderBy($sortBy, $sortDirection);
        }

        // Paginación
        $inventory = $query->paginate($perPage)
            ->through(function ($warehouseProduct) {
                $productBase = $warehouseProduct->productBaseBranch?->productBase;
                $productBaseBranch = $warehouseProduct->productBaseBranch;

                return [
                    'id' => $warehouseProduct->id,
                    'product_name' => $productBase?->name ?? '[Producto eliminado]',
                    'sku' => $productBase?->sku_base ?? 'N/A',
                    'sale_type' => $productBaseBranch?->sale_type ?? 'unit',
                    'stock' => $warehouseProduct->stock,
                    'min_stock' => $warehouseProduct->min_stock,
                    'is_low_stock' => $warehouseProduct->min_stock 
                        ? $warehouseProduct->stock <= $warehouseProduct->min_stock 
                        : false,
                ];
            });

        return Inertia::render('empleados/almacen/inventario', [
            'sucursal' => [
                'id' => $sucursal->id,
                'nombre' => $sucursal->nombre,
            ],
            'almacen' => [
                'id' => $almacen->id,
                'nombre' => $almacen->nombre,
                'descripcion' => $almacen->descripcion,
                'ubicacion' => $almacen->ubicacion,
                'activo' => $almacen->activo,
            ],
            'inventory' => $inventory,
            'filters' => [
                'search' => $search,
                'sortBy' => $sortBy,
                'sortDirection' => $sortDirection,
                'perPage' => (int)$perPage,
            ],
        ]);
    }
}
