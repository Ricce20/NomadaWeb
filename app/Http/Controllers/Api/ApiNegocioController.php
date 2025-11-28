<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Negocio;
use App\Models\Sucursal;
use App\Models\ProductBaseBranch;

class ApiNegocioController extends Controller
{
    const PER_PAGE = 10;

    /**
     * Get all negocios with optional search (solo datos públicos)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllWithSucursales(Request $request)
    {
        // Validar entrada
        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100'
        ]);

        // Solo negocios activos
        $query = Negocio::query()
            ->where('activo', true)
            ->with(['sucursales' => function($query) {
                $query->where('activo', true)
                    ->select([
                        'id',
                        'nombre',
                        'direccion_completa',
                        'telefono',
                        'horarios',
                        'codigo_postal',
                        'latitud',
                        'longitud',
                        'negocio_id',
                        'activo',
                        'image_url'
                    ]);
            }])
            ->select([
                'id',
                'nombre',
                'telefono',
                'descripcion',
                'logo',
                'activo'
            ]);

        // Aplicar búsqueda si existe
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            
            $query->where(function($q) use($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('descripcion', 'like', "%{$search}%")
                    ->orWhereHas('sucursales', function($q) use($search) {
                        $q->where('activo', true)
                          ->where(function($subQ) use($search) {
                              $subQ->where('nombre', 'like', "%{$search}%")
                                   ->orWhere('direccion_completa', 'like', "%{$search}%");
                          });
                    });
            });
        }

        // Paginación
        $perPage = $request->input('per_page', self::PER_PAGE);
        $paginated = $query->paginate($perPage)->withQueryString();
        
        return response()->json([
            'success' => true,
            'data' => $paginated->items(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'from' => $paginated->firstItem(),
                'to' => $paginated->lastItem()
            ],
            'filters' => $request->only('search', 'per_page')
        ], 200); 
    }

    public function getAllOnlyNegocios(Request $request)
    {
        // Validar entrada
        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100'
        ]);

        // Solo negocios activos
        $query = Negocio::query()
            ->where('activo', true)
            ->select([
                'id',
                'nombre',
                'telefono',
                'descripcion',
                'logo',
                'activo'
            ]);

        // Aplicar búsqueda si existe
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            
            $query->where(function($q) use($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('telefono', 'like', "%{$search}%");
            });
        }

        // Paginación
        $perPage = $request->input('per_page', self::PER_PAGE);
        $paginated = $query->paginate($perPage)->withQueryString();
        
        return response()->json([
            'success' => true,
            'data' => $paginated->items(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'from' => $paginated->firstItem(),
                'to' => $paginated->lastItem()
            ],
            'filters' => $request->only('search', 'per_page')
        ], 200); 
    }

    /**
     * Get negocio by ID (solo datos públicos)
     * 
     * @param string|int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getById(string|int $id)
    {
        try {
            // Buscar solo negocios activos con campos públicos
            $negocio = Negocio::where('activo', true)
                ->where('id', $id)
                ->select([
                    'id',
                    'nombre',
                    'telefono',
                    'descripcion',
                    'logo'
                ])
                ->with(['sucursales' => function($query) {
                    $query->where('activo', true)
                        ->select([
                            'id',
                            'nombre',
                            'direccion_completa',
                            'telefono',
                            'horarios',
                            'codigo_postal',
                            'latitud',
                            'longitud',
                            'negocio_id',
                            'image_url'
                        ]);
                }])
                ->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => $negocio
            ], 200);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Negocio no encontrado o no disponible'
            ], 404);
        }
    }

    /**
     * Get products by sucursal ID (solo datos públicos)
     * 
     * @param Request $request
     * @param string|int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProductsBySucursalId(Request $request, string|int $id)
    {
        try {
            // Validar entrada
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'per_page' => 'nullable|integer|min:1|max:100',
                'category_id' => 'nullable|integer',
                'brand_id' => 'nullable|integer',
                'min_price' => 'nullable|numeric|min:0',
                'max_price' => 'nullable|numeric|min:0'
            ]);

            // Verificar que la sucursal existe y está activa
            $sucursal = Sucursal::where('id', $id)
                ->where('activo', true)
                ->select([
                    'id',
                    'nombre',
                    'direccion_completa',
                    'telefono',
                    'negocio_id',
                    'image_url'
                ])
                ->firstOrFail();

            // Query de productos por sucursal
            $query = ProductBaseBranch::query()
                ->where('branch_id', $sucursal->id)
                ->with([
                    'productBase' => function($q) {
                        $q->where('is_active', true)
                          ->select([
                              'id',
                              'sku_base',
                              'name',
                              'brand_id',
                              'category_id',
                              'uom_id',
                              'tax_code',
                              'specs_json'
                          ])
                          ->with([
                              'brand:id,name',
                              'category:id,name',
                              'uom:id,name,abbreviation'
                          ]);
                    }
                ])
                ->select([
                    'id',
                    'product_base_id',
                    'branch_id',
                    'price',
                    'sale_type',
                    'image_path'
                ]);

            // Aplicar búsqueda si existe
            if ($request->filled('search')) {
                $search = trim($request->input('search'));
                
                $query->whereHas('productBase', function($q) use($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('sku_base', 'like', "%{$search}%");
                });
            }

            // Filtro por categoría
            if ($request->filled('category_id')) {
                $query->whereHas('productBase', function($q) use($request) {
                    $q->where('category_id', $request->input('category_id'));
                });
            }

            // Filtro por marca
            if ($request->filled('brand_id')) {
                $query->whereHas('productBase', function($q) use($request) {
                    $q->where('brand_id', $request->input('brand_id'));
                });
            }

            // Filtro por rango de precio
            if ($request->filled('min_price')) {
                $query->where('price', '>=', $request->input('min_price'));
            }

            if ($request->filled('max_price')) {
                $query->where('price', '<=', $request->input('max_price'));
            }

            // Paginación
            $perPage = $request->input('per_page', self::PER_PAGE);
            $paginated = $query->paginate($perPage)->withQueryString();
            
            return response()->json([
                'success' => true,
                'data' => $paginated->items(),
                'pagination' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                    'from' => $paginated->firstItem(),
                    'to' => $paginated->lastItem()
                ],
                'filters' => $request->only(['search', 'per_page', 'category_id', 'brand_id', 'min_price', 'max_price']),
                'sucursal' => $sucursal
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Sucursal no encontrada o no disponible'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los productos',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

        /**
     * Get random products from all branches (datos públicos)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRandomProducts(Request $request)
    {
        try {
            // Validar entrada
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'per_page' => 'nullable|integer|min:1|max:100',
                'category_id' => 'nullable|integer',
                'brand_id' => 'nullable|integer',
                'min_price' => 'nullable|numeric|min:0',
                'max_price' => 'nullable|numeric|min:0',
                'negocio_id' => 'nullable|integer' // Filtrar por negocio específico
            ]);

            // Query de productos de todas las sucursales activas
            $query = ProductBaseBranch::query()
                ->whereHas('branch', function($q) use($request) {
                    $q->where('activo', true);
                    
                    // Filtrar por negocio si se especifica
                    if ($request->filled('negocio_id')) {
                        $q->where('negocio_id', $request->input('negocio_id'));
                    }
                })
                ->with([
                    'productBase' => function($q) {
                        $q->where('is_active', true)
                        ->select([
                            'id',
                            'sku_base',
                            'name',
                            'brand_id',
                            'category_id',
                            'uom_id',
                            'tax_code',
                            'specs_json',
                            'description'
                        ])
                        ->with([
                            'brand:id,name',
                            'category:id,name',
                            'uom:id,name,abbreviation'
                        ]);
                    },
                    'branch' => function($q) {
                        $q->select([
                            'id',
                            'nombre',
                            'direccion_completa',
                            'telefono',
                            'negocio_id'
                        ])
                        ->with([
                            'negocio:id,nombre,logo'
                        ]);
                    }
                ])
                ->select([
                    'id',
                    'product_base_id',
                    'branch_id',
                    'price',
                    'sale_type',
                    'image_path'
                ]);

            // Aplicar búsqueda si existe
            if ($request->filled('search')) {
                $search = trim($request->input('search'));
                
                $query->whereHas('productBase', function($q) use($search) {
                    $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku_base', 'like', "%{$search}%");
                });
            }

            // Filtro por categoría
            if ($request->filled('category_id')) {
                $query->whereHas('productBase', function($q) use($request) {
                    $q->where('category_id', $request->input('category_id'));
                });
            }

            // Filtro por marca
            if ($request->filled('brand_id')) {
                $query->whereHas('productBase', function($q) use($request) {
                    $q->where('brand_id', $request->input('brand_id'));
                });
            }

            // Filtro por rango de precio
            if ($request->filled('min_price')) {
                $query->where('price', '>=', $request->input('min_price'));
            }

            if ($request->filled('max_price')) {
                $query->where('price', '<=', $request->input('max_price'));
            }

            // Ordenar aleatoriamente
            $query->inRandomOrder();

            // Paginación
            $perPage = $request->input('per_page', self::PER_PAGE);
            $paginated = $query->paginate($perPage)->withQueryString();
            
            
            return response()->json([
                'success' => true,
                'data' => $paginated->items(),
                'pagination' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                    'from' => $paginated->firstItem(),
                    'to' => $paginated->lastItem()
                ],
                'filters' => $request->only([
                    'search', 
                    'per_page', 
                    'category_id', 
                    'brand_id', 
                    'min_price', 
                    'max_price',
                    'negocio_id'
                ])
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los productos',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    public function searchProducts(Request $request)
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Validación - warehouse_id es completamente opcional
            $validated = $request->validate([
                'search' => 'required|string|max:255',
                'sucursal_id' => 'required|integer|exists:sucursales,id',
                'warehouse_id' => 'nullable|integer|exists:almacenes,id'
            ]);

            $sucursalId = $validated['sucursal_id'];
            $searchTerm = trim($validated['search']);
            $warehouseId = $validated['warehouse_id'] ?? null;

            // Verificar que el usuario tenga acceso a esta sucursal
            $userHasAccess = $user->sucursales()
                ->where('sucursales.id', $sucursalId)
                ->exists();

            if (!$userHasAccess) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso a esta sucursal'
                ], 403);
            }

            // Buscar productos en la sucursal
            $productos = ProductBaseBranch::query()
                ->where('branch_id', $sucursalId)
                ->whereHas('productBase', function($q) use ($searchTerm) {
                    $q->where('is_active', true)
                    ->where(function($subQ) use ($searchTerm) {
                        $subQ->where('name', 'like', "%{$searchTerm}%")
                            ->orWhere('sku_base', 'like', "%{$searchTerm}%");
                    });
                })
                ->with([
                    'productBase' => function($q) {
                        $q->select('id', 'sku_base', 'name', 'brand_id', 'category_id', 'uom_id', 'tax_code', 'specs_json','description')
                        ->with([
                            'brand:id,name', 
                            'category:id,name', 
                            'uom:id,name,abbreviation'
                        ]);
                    },
                    'warehouseProducts' => function($q) use ($sucursalId, $warehouseId) {
                        // Filtrar por almacenes de la sucursal actual
                        $q->whereHas('warehouse', function($warehouseQ) use ($sucursalId) {
                            $warehouseQ->where('sucursal_id', $sucursalId);
                        });
                        
                        // Si se especifica warehouse_id, filtrar solo ese almacén
                        if ($warehouseId) {
                            $q->where('almacen_id', $warehouseId);
                        }
                        
                        $q->select('id', 'almacen_id', 'product_base_branch_id', 'stock')
                        ->with('warehouse:id,nombre,sucursal_id'); // Nota: el campo es 'nombre' no 'name'
                    }
                ])
                ->select('id', 'product_base_id', 'branch_id', 'price', 'sale_type', 'image_path')
                ->limit(20)
                ->get()
                ->map(function($productBranch) use ($warehouseId) {
                    $productBase = $productBranch->productBase;
                    
                    // Calcular stock total
                    $currentStock = $productBranch->warehouseProducts->sum('stock');
                    
                    // Preparar información de stocks por almacén
                    $warehouseStocks = $productBranch->warehouseProducts->map(function($wp) {
                        return [
                            'warehouse_id' => $wp->almacen_id,
                            'warehouse_name' => $wp->warehouse->nombre ?? 'Sin nombre',
                            'stock' => (float) $wp->stock
                        ];
                    })->toArray();

                    return [
                        'id' => $productBranch->id,
                        'product_base_id' => $productBranch->product_base_id,
                        'nombre' => $productBase->name,
                        'descripcion' => $productBase->description ?? '',
                        'sku' => $productBase->sku_base,
                        'unidad_medida' => $productBase->uom->abbreviation ?? $productBase->uom->name ?? 'UND',
                        'precio' => (float) $productBranch->price,
                        'imagen_url' => $productBranch->image_path 
                            ? asset('storage/' . $productBranch->image_path) 
                            : null,
                        'marca' => $productBase->brand->name ?? null,
                        'categoria' => $productBase->category->name ?? null,
                        'sale_type' => $productBranch->sale_type,
                        'current_stock' => (float) $currentStock,
                        'warehouse_stocks' => $warehouseStocks,
                        'filtered_by_warehouse' => $warehouseId !== null
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $productos,
                'filters' => [
                    'search_term' => $searchTerm,
                    'sucursal_id' => $sucursalId,
                    'warehouse_id' => $warehouseId
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error en searchProducts: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar productos',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}