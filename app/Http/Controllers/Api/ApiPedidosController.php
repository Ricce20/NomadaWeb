<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Models\NegocioCliente;
use App\Models\Pedido;
use App\Models\PedidoDetalle;
use App\Models\PedidoEstadoHistorial;
use App\Models\Almacen;
use App\Models\InventoryMovement;
use App\Models\InventoryMovementDetail;
use App\Models\WarehouseProduct;
use App\Models\ProductBaseBranch;
use App\Models\User;
use App\Models\Sucursal;
use App\Models\ViajePedido;
use App\Services\InventoryService;

class ApiPedidosController extends Controller
{
    // private function generateMovementNumber(string|int $sucursalId): string
    // {
    //     $prefix = 'PED';
    //     $date = now()->format('Ymd');
        
    //     // Contar movimientos del día
    //     $count = InventoryMovement::whereDate('created_at', today())
    //         ->where('sucursal_id', $sucursalId)
    //         ->count() + 1;
        
    //     return "{$sucursalId}-{$prefix}-{$date}-" . str_pad($count, 6, '0', STR_PAD_LEFT);
    // }

    /**
     * Crear un nuevo pedido
     * POST /api/pedidos
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'sucursal_id' => 'required|exists:sucursales,id',
            'direccion_entrega' => 'nullable|string|max:500',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'requiere_envio' => 'required|boolean',
            'distancia_km' => 'nullable|numeric|min:0',
            'duracion_minutos' => 'nullable|integer|min:0',
            'costo_envio' => 'nullable|numeric|min:0',
            'productos' => 'required|array|min:1',
            'productos.*.producto_id' => 'required|integer',
            'productos.*.cantidad' => 'required|integer|min:1',
            'productos.*.precio_unitario' => 'required|numeric|min:0',
            'subtotal' => 'required|numeric|min:0',
            'total' => 'required|numeric|min:0',
            'notas_pago' => 'nullable|string|max:1000',
            'metodo_pago_adelanto' => 'nullable|string|in:efectivo,tarjeta,transferencia,otro',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();

        // Cargar datos necesarios en una sola consulta
        $user = User::find($validated['user_id']);
        if (!$user || $user->type != 'client') {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        $sucursal = Sucursal::find($validated['sucursal_id']);
        if (!$sucursal) {
            return response()->json([
                'success' => false,
                'message' => 'Sucursal no encontrada'
            ], 404);
        }

        // Obtener IDs de productos para validaciones
        $productoIds = collect($validated['productos'])->pluck('producto_id')->unique();
        
        // Validar existencia de productos en una sola consulta
        $productosExistentes = ProductBaseBranch::whereIn('id', $productoIds)
            ->pluck('id')
            ->toArray();

        $productosInexistentes = array_diff($productoIds->toArray(), $productosExistentes);
        if (!empty($productosInexistentes)) {
            return response()->json([
                'success' => false,
                'message' => 'Algunos productos no existen',
                'errors' => ['productos' => 'Los siguientes productos no existen: ' . implode(', ', $productosInexistentes)]
            ], 404);
        }

        // Validar cálculos
        $expectedSubtotal = collect($validated['productos'])->sum(function($prod) {
            return $prod['cantidad'] * $prod['precio_unitario'];
        });

        if (abs($expectedSubtotal - (float)$validated['subtotal']) > 0.01) {
            return response()->json([
                'success' => false,
                'message' => 'El subtotal no coincide con los productos'
            ], 422);
        }

        $expectedTotal = $expectedSubtotal + ((float)($validated['costo_envio'] ?? 0));
        if (abs($expectedTotal - (float)$validated['total']) > 0.01) {
            return response()->json([
                'success' => false,
                'message' => 'El total no coincide'
            ], 422);
        }

        // Preparar datos para transacción
        $montoAdelanto = 0;
        $pagoCompleto = false;
        $requiereEnvio = (bool)$validated['requiere_envio'];
        
        $estadoPedido = 'pendiente';
        $estadoMovimiento = 'pendiente';
        $notaEstado = $validate['notas_pago'];

        DB::beginTransaction();
        
        try {
            // Generar folio
            $lastPedido = Pedido::where('sucursal_id', $validated['sucursal_id'])
                ->orderBy('id', 'desc')
                ->first(['id', 'folio']);
                
            $date = now()->format('Ymd');
            $nextNumber = $lastPedido ? (int)substr($lastPedido->folio, -6) + 1 : 1;
            $folio = "{$sucursal->id}-PED-{$date}" . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

            // Crear pedido
            $pedido = Pedido::create([
                'folio' => $folio,
                'user_id' => $user->id,
                'created_by' => $user->id,
                'sucursal_id' => $sucursal->id,
                'direccion_entrega' => $validated['direccion_entrega'],
                'latitud' => $validated['latitud'],
                'longitud' => $validated['longitud'],
                'requiere_envio' => $requiereEnvio,
                'distancia_km' => $validated['distancia_km'] ?? null,
                'duracion_minutos' => $validated['duracion_minutos'] ?? null,
                'costo_envio' => $validated['costo_envio'] ?? 0,
                'subtotal' => $validated['subtotal'],
                'total' => $validated['total'],
                'monto_adelanto' => $montoAdelanto,
                'pago_completo' => $pagoCompleto,
                'saldo_pendiente' => $validated['total'] - $montoAdelanto,
                'notas_pago' => $validated['notas_pago'] ?? null,
                'estado_pago' => 'pendiente',
                'estado' => $estadoPedido,
                'fecha_pedido' => now(),
            ]);

            // Crear detalles del pedido en lote
            $detallesPedido = [];
            foreach ($validated['productos'] as $producto) {
                $detallesPedido[] = [
                    'pedido_id' => $pedido->id,
                    'product_base_branch_id' => $producto['producto_id'],
                    'cantidad' => $producto['cantidad'],
                    'precio_unitario' => $producto['precio_unitario'],
                    'subtotal' => $producto['cantidad'] * $producto['precio_unitario'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            PedidoDetalle::insert($detallesPedido);

            // Registrar historial
            PedidoEstadoHistorial::create([
                'pedido_id' => $pedido->id,
                'estado_anterior' => null,
                'estado_nuevo' => $estadoPedido,
                'notas' => $notaEstado,
            ]);

            // Obtener almacenes de la sucursal
            $almacenes = Almacen::where('sucursal_id', $validated['sucursal_id'])
                ->where('activo', true)
                ->get(['id']);

            if ($almacenes->isEmpty()) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron almacenes activos para esta sucursal'
                ], 404);
            }

            $almacenIds = $almacenes->pluck('id');

            // Cargar stock de todos los productos en todos los almacenes en una sola consulta
            $stockProductos = WarehouseProduct::whereIn('product_base_branch_id', $productoIds)
                ->whereIn('almacen_id', $almacenIds)
                ->get()
                ->groupBy('almacen_id'); // ← Cambiado para agrupar por almacén

            // Asignar productos a almacenes (nueva función)
            $asignacionAlmacenes = $this->asignarProductosAAlmacenes($validated['productos'], $almacenes, $stockProductos);

            // Generar número de movimiento base
            $baseMovementNumber = $this->generateMovementNumber($sucursal->id);
            $motivoMovimiento = $pagoCompleto 
                ? "Salida completada por pedido {$folio} - Cliente: {$user->name}"
                : "Salida reservada por pedido {$folio} - Cliente: {$user->name}";

            // Preparar datos para movimientos de inventario
            $movementDetails = [];
            $now = now();

            // Crear movimientos por almacén
            foreach ($asignacionAlmacenes as $almacenId => $productosAlmacen) {
                if (empty($productosAlmacen)) continue;

                // Crear movimiento de inventario para este almacén
                $movementId = DB::table('inventory_movements')->insertGetId([
                    'almacen_id' => $almacenId,
                    'sucursal_id' => $validated['sucursal_id'],
                    'type' => 'out',
                    'reason' => $motivoMovimiento,
                    'performed_by' => auth()->id() ?? null,
                    'status' => $estadoMovimiento,
                    'movement_number' => $baseMovementNumber . "-ALM" . $almacenId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                // Crear detalles para este movimiento
                foreach ($productosAlmacen as $productoAsignado) {
                    $productoId = $productoAsignado['producto_id'];
                    $cantidad = $productoAsignado['cantidad'];
                    
                    // Obtener stock actual
                    $currentStock = $stockProductos->get($almacenId, collect())
                        ->where('product_base_branch_id', $productoId)
                        ->first();

                    $stockActual = $currentStock ? $currentStock->stock : 0;

                    $movementDetails[] = [
                        'inventory_movement_id' => $movementId,
                        'product_base_branch_id' => $productoId,
                        'quantity' => $cantidad,
                        'current_stock' => $stockActual,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            // Insertar todos los detalles de movimiento en lote
            if (!empty($movementDetails)) {
                InventoryMovementDetail::insert($movementDetails);
            }

            DB::commit();

            // Cargar relaciones para respuesta (optimizado)
            $pedido->load([
                'cliente:id,nombre,apellidos,telefono',
                'detalles.productBaseBranch.productBase:id,name,sku_base'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pedido creado exitosamente',
                'data' => [
                    'pedido' => $pedido,
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el pedido',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Asigna productos a almacenes buscando el que tenga stock suficiente
     * Lanza excepción inmediatamente si no hay stock suficiente
     */
    // private function asignarProductosAAlmacenes($productos, $almacenes, $stockProductos)
    // {
    //     $asignacion = [];
        
    //     // Inicializar estructura por almacén
    //     foreach ($almacenes as $almacen) {
    //         $asignacion[$almacen->id] = [];
    //     }

    //     foreach ($productos as $producto) {
    //         $productoId = $producto['producto_id'];
    //         $cantidadNecesaria = $producto['cantidad'];
    //         $asignado = false;

    //         // Primero buscar almacén con stock suficiente completo
    //         foreach ($almacenes as $almacen) {
    //             $stockEnAlmacen = $stockProductos->get($almacen->id, collect())
    //                 ->where('product_base_branch_id', $productoId)
    //                 ->first();

    //             $stockDisponible = $stockEnAlmacen ? $stockEnAlmacen->stock : 0;

    //             if ($stockDisponible >= $cantidadNecesaria) {
    //                 $asignacion[$almacen->id][] = [
    //                     'producto_id' => $productoId,
    //                     'cantidad' => $cantidadNecesaria
    //                 ];
    //                 $asignado = true;
    //                 break;
    //             }
    //         }

    //         // Si no se encontró almacén con stock completo, distribuir entre varios
    //         if (!$asignado) {
    //             $cantidadRestante = $cantidadNecesaria;
                
    //             foreach ($almacenes as $almacen) {
    //                 if ($cantidadRestante <= 0) break;

    //                 $stockEnAlmacen = $stockProductos->get($almacen->id, collect())
    //                     ->where('product_base_branch_id', $productoId)
    //                     ->first();

    //                 $stockDisponible = $stockEnAlmacen ? $stockEnAlmacen->stock : 0;

    //                 if ($stockDisponible > 0) {
    //                     $cantidadAAsignar = min($stockDisponible, $cantidadRestante);
    //                     $asignacion[$almacen->id][] = [
    //                         'producto_id' => $productoId,
    //                         'cantidad' => $cantidadAAsignar
    //                     ];
    //                     $cantidadRestante -= $cantidadAAsignar;
    //                 }
    //             }

    //             // ← CANCELAR INMEDIATAMENTE si queda cantidad sin asignar
    //             if ($cantidadRestante > 0) {
    //                 throw new \Exception("Stock insuficiente para el producto ID {$productoId}. Se necesitan {$cantidadNecesaria} unidades, pero solo hay " . ($cantidadNecesaria - $cantidadRestante) . " disponibles en todos los almacenes.");
    //             }
    //         }
    //     }

    //     return $asignacion;
    // }

    //optener pedido por id del pedido PARA EL CLIENTE USER
    public function show($id): JsonResponse
    {
        $pedido = Pedido::with([
            'user:id,name,phone',
            'detalles.productBaseBranch.productBase:id,name,sku_base,description',
            'statusHistories',
            'estadoViaje.conductor:id,name,phone',

        ])->find($id);

        if (!$pedido) {
            return response()->json([
                'success' => false,
                'message' => 'Pedido no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'pedido' => $pedido,
            ]
        ], 200);
    }

    //OBTENER TODOS LOS PEDIDOS DE UN USUARIO CLIENTE
    public function pedidosPorUsuario($userId): JsonResponse
    {
        $user = User::find($userId);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }
        $pedidos = Pedido::with([
            'user:id,name,phone',
            'detalles.productBaseBranch.productBase:id,name,sku_base',
            'statusHistories',
            'estadoViaje.conductor:id,name,phone',
            'sucursal.negocio:id,nombre,logo'

        ])->where('user_id', $userId)
          ->orderBy('created_at', 'desc')
          ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'pedidos' => $pedidos,
            ]
        ], 200);
    }     
    // pedidos de los clientes
    public function pedidosActivosClienteUser(string | int $userId){
        $user = User::find($userId);
        if(!$user){
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        $pedidos = Pedido::with([
            'user:id,name,phone',
            'detalles.productBaseBranch.productBase:id,name,sku_base',
            'statusHistories',
            'estadoViaje.conductor:id,name,phone',
            'sucursal.negocio:id,nombre,logo'
        ])->whereIn('estado',['en_ruta','pendiente','confirmado'])
        ->where('user_id',$user->id)
        ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'pedidos_activos' => $pedidos
            ]
        ]);
    }
    //PARA EL USUARIO CONDUCTOR O REPARTIDOR ----------------------------------------------------------

    public function pedidosAsignadosActivos($conductorId): JsonResponse
    {
        $conductor = User::where('id',$conductorId)->where('type','driver')->first();
        if (!$conductor) {
            return response()->json([
                'success' => false,
                'message' => 'Conductor no encontrado'
            ], 404);
        }

        $viajesPedidos = ViajePedido::with([
            'pedido.user:id,name,phone',
            'pedido.detalles.productBaseBranch.productBase:id,name,sku_base,description',
            'pedido.statusHistories',
            'vehiculo:id,marca,modelo,placa',
            // 'pedido',
        ])->where('conductor_id', $conductorId)
        ->whereIn('estado', ['asignado', 'en_ruta'])
          ->orderBy('created_at', 'desc')
          ->get();

        $viajesPendientes = ViajePedido::where('estado','asignado')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'pedidos_activos' => $viajesPedidos,
                'pedidos_pendientes' => $viajesPendientes
            ]
        ], 200);
    }

    //historial de pedidos del conductor
    public function historialPedidosConductor($conductorId): JsonResponse
    {
        $conductor = User::where('id',$conductorId)->where('type','driver')->first();
        if (!$conductor) {
            return response()->json([
                'success' => false,
                'message' => 'Conductor no encontrado'
            ], 404);
        }

        $viajesPedidos = ViajePedido::with([
                'pedido:id,folio,user_id,cliente_id',
                'pedido.user:id,name,phone',
                'vehiculo:id,placa,modelo,tipo',
                'pedido.cliente:id,nombre,apellidos,telefono'
            ])->where('conductor_id', $conductorId)
            ->whereIn('estado', ['entregado', 'cancelado'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'pedido_id' => $item->pedido_id,
                'vehiculo_id' => $item->vehiculo_id,
                'estado' => $item->estado,
                'fecha_asignacion' => $item->fecha_asignacion,
                'fecha_salida' => $item->fecha_salida,
                'fecha_entrega' => $item->fecha_entrega,
                'conductor_id' => $item->conductor_id,
                'pedido' => $item->pedido ? [
                    'id' => $item->pedido->id,
                    'folio' => $item->pedido->folio,
                    'cliente_user' => $item->pedido->user ? [
                        'id' => $item->pedido->user->id,
                        'nombre' => $item->pedido->user->name,
                        'telefono' => $item->pedido->user->phone
                    ] : null,
                    'cliente_fisico' => $item->pedido->cliente ? [
                        'id' => $item->pedido->cliente->id,
                        'nombre' => $item->pedido->cliente->nombre,
                        'apellidos' => $item->pedido->cliente->apellidos,
                        'telefono' => $item->pedido->cliente->telefono
                    ] : null
                ] : null,
                'vehiculo' => $item->vehiculo ?? null
            ]);
        $viajesCancelados = ViajePedido::where('estado','cancelado')->count();
        $viajesCompletados = ViajePedido::where('estado','entregado')->count();
        return response()->json([
            'success' => true,
            'data' => [
                'historial_viajes' => $viajesPedidos,
                'viajes_cancelados' => $viajesCancelados,
                'viajes_completados' => $viajesCompletados
            ]
        ], 200);
    }
    //detalles del pedido y viaje por el id
    public function detallesPedidoViaje($viajePedidoId): JsonResponse
    {
        $viajePedido = ViajePedido::with([
            'pedido.user:id,name,phone',
            'pedido.cliente:id,nombre,apellidos,telefono,activo',
            'pedido.detalles.productBaseBranch.productBase:id,name,sku_base,description',
            'pedido.statusHistories',
            'vehiculo:id,marca,modelo,placa',
        ])->find($viajePedidoId);

        if (!$viajePedido) {
            return response()->json([
                'success' => false,
                'message' => 'Viaje Pedido no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'viaje_pedido' => $viajePedido,
            ]
        ], 200);
    }

    //atualizar estado del pedido y viaje por el conductor
    public function actualizarEstadoViajePedido(Request $request, $viajePedidoId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'estado_viaje' => 'required|string|in:en_ruta,entregado,cancelado',
            'motivo_cancelacion' => 'nullable|string|max:1000',
            'estado_pago' => 'nullable|string|in:pendiente,pagado',
            'monto_recibido' => 'nullable|numeric|min:0',
            
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $viajePedido = ViajePedido::find($viajePedidoId);
        if (!$viajePedido) {
            return response()->json([
                'success' => false,
                'message' => 'Viaje Pedido no encontrado'
            ], 404);
        }

        $pedido = Pedido::find($viajePedido->pedido_id);
        if(!$pedido){
            return response()->json([
                'success' => false,
                'message' => 'Pedido no encontrado'
            ]);
        }
        $estadoAnterior = $pedido->estado;
        $notas = 'no se agregaron notas';

        $viajePedido->estado = $validator->validated()['estado_viaje'];
        // Actualizar fechas según el estado
        if ($viajePedido->estado === 'en_ruta') {
            $viajePedido->fecha_salida = now();
            $pedido->estado = 'en_ruta';
            $notas = 'El pedido esta en camino';
        } elseif ($viajePedido->estado === 'entregado') {
            $viajePedido->fecha_entrega = now();
            $pedido->estado = 'entregado';
            $pedido->estado_pago = 'pagado';
            $pedido->pago_completo = true;
            $pedido->monto_adelanto += $validator->validated()['monto_recibido'] ?? $pedido->monto_adelanto;
            $pedido->saldo_pendiente = max(0, $pedido->total - $pedido->monto_adelanto);
            
            $pedido->fecha_entrega = now();
            $notas = 'El pedido ha sido entregado por el conductor repartidor';
            $saldo = floatval($pedido->saldo_pendiente);
            if($saldo > 0){
                $pedido->estado = 'pendiente';            
                $pedido->estado_pago = 'pendiente';
                $pedido->pago_completo = false;
                $viajePedido->estado = 'asignado';
                $notas = 'El pedido fue entregado pero el cliente falta por pagar un monto restante';
            }
        }
        if($viajePedido->estado === 'cancelado'){
            $pedido->estado = 'cancelado';
            $pedido->motivo_cancelacion = $validator->validated()['motivo_cancelacion'] ?? 'Sin motivo especificado';
            $pedido->fecha_cancelacion = now();
            $notas = 'El pedido se ha cancelado';


        }
        $viajePedido->save();
        $pedido->save();
        PedidoEstadoHistorial::create([
                'pedido_id' => $pedido->id,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo' => $pedido->estado,
                'notas' => $notas,
        ]);
        $viajePedido->load([
            'pedido.user:id,name,phone',
            'pedido.cliente:id,nombre,apellidos,telefono,activo',
            'pedido.detalles.productBaseBranch.productBase:id,name,sku_base,description',
            'pedido.statusHistories',
            'vehiculo:id,marca,modelo,placa',
        ]);
        return response()->json([
            'success' => true,
            'message' => 'Estado del viaje pedido actualizado exitosamente',
            'data' => [
                'viaje_pedido' => $viajePedido,
            ]
        ], 200);
    }


    /**
     * Calcula el costo de envío usando OSRM y la fórmula de tarifa base + adicional.
     * @param int $negocioId ID del negocio
     * @param int $sucursalId ID de la sucursal (origen)
     * @param Request $request Contiene 'latitud', 'longitud' (query params) y 'direccion' (body)
     * @return \Illuminate\Http\JsonResponse
     */
    public function obtenerCostoEnvio(int $negocioId, int $sucursalId, Request $request)
    {
        // 1. Validación de la solicitud del cliente
        // Latitud y Longitud vienen como query params
        $validator = Validator::make($request->all(), [
            'latitud' => 'required|numeric|between:-90,90',
            'longitud' => 'required|numeric|between:-180,180',
            'direccion' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de validación incorrectos.',
                'errors' => $validator->errors()
            ], 422);
        }

        // 2. Buscar la Sucursal (Origen)
        $sucursal = Sucursal::where('id', $sucursalId)
                            ->where('negocio_id', $negocioId)
                            ->first();

        if (!$sucursal) {
            return response()->json([
                'message' => 'Sucursal no encontrada para el negocio especificado.'
            ], 404);
        }

        // Coordenadas de origen (sucursal)
        $startLat = $sucursal->latitud;
        $startLon = $sucursal->longitud;
        
        // Validar que la sucursal tenga coordenadas
        if (is_null($startLat) || is_null($startLon)) {
            return response()->json([
                'message' => 'La sucursal no tiene coordenadas configuradas.'
            ], 400);
        }
        
        // Coordenadas de destino (del cliente) - vienen de query params
        $endLat = $request->query('latitud') ?? $request->input('latitud');
        $endLon = $request->query('longitud') ?? $request->input('longitud');
        
        // Dirección viene del body
        $direccion = $request->input('direccion');

        // INSTANCIA DEL SERVICIO
        $service = new InventoryService();

        // 3. Obtener datos de la ruta con OSRM
        $routeData = $service->getRouteData(
            $startLat, $startLon, $endLat, $endLon
        );

        if (!$routeData) {
            return response()->json([
                'message' => 'No se pudo calcular la ruta con OSRM. Verifique las coordenadas.'
            ], 503);
        }

        $distanceKm = $routeData['distance_km'];
        $durationMinutes = $routeData['duration_minutes'];

        // 4. Aplicar la fórmula de costos
        
        $tarifaBase = 30.00;
        $kmBase = 2.0; // Los primeros 2 km
        $tarifaAdicionalKm = 8.00;

        if ($distanceKm <= $kmBase) {
            // Distancia menor o igual a 2 km
            $costoEnvio = $tarifaBase;
        } else {
            // Distancia mayor a 2 km
            $kmAdicionales = $distanceKm - $kmBase;
            $costoAdicional = $kmAdicionales * $tarifaAdicionalKm;
            $costoEnvio = $tarifaBase + $costoAdicional;
        }

        // 5. Responder al cliente
        return response()->json([
            'sucursal_id' => $sucursal->id, // ID de la sucursal
            'costo' => round($costoEnvio, 2),
            'detalles' => [
                'distancia_km' => round($distanceKm, 2),
                'tiempo_estimado_min' => round($durationMinutes, 0),
                'tarifa_base' => $tarifaBase,
                'tarifa_adicional_km' => $tarifaAdicionalKm,
                'direccion_destino' => $direccion
            ]
        ], 200);
    }

    /**
     * Crea un pedido individual desde la app móvil para una sucursal específica
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function crearPedidoIndividual(Request $request)
    {
        // 1. VALIDACIÓN DE DATOS
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'sucursal_id' => 'required|integer|exists:sucursales,id',
            'tipo_entrega' => 'required|string|in:pickup,delivery',
            
            // Datos de entrega (requeridos solo si tipo_entrega = delivery)
            'direccion_entrega' => 'required_if:tipo_entrega,delivery|nullable|string|max:500',
            'latitud' => 'required_if:tipo_entrega,delivery|nullable|numeric|between:-90,90',
            'longitud' => 'required_if:tipo_entrega,delivery|nullable|numeric|between:-180,180',
            
            // Datos de envío calculados en el cliente
            'costo_envio' => 'nullable|numeric|min:0',
            'distancia_km' => 'nullable|numeric|min:0',
            'tiempo_estimado_min' => 'nullable|integer|min:0',
            
            // Productos del carrito
            'productos' => 'required|array|min:1',
            'productos.*.producto_id' => 'required|integer|exists:product_base_branch,id',
            'productos.*.cantidad' => 'required|integer|min:1|max:1000',
            'productos.*.precio_unitario' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        
        try {
            $validated = $validator->validated();
            
            // 2. VERIFICAR SUCURSAL Y OBTENER NEGOCIO
            $sucursal = Sucursal::with('negocio')->findOrFail($validated['sucursal_id']);
            
            // 3. CALCULAR SUBTOTAL
            $subtotal = 0;
            $productoIds = collect($validated['productos'])->pluck('producto_id')->unique();
            $productosExistentes = ProductBaseBranch::whereIn('id', $productoIds)->get()->keyBy('id');
            
            foreach ($validated['productos'] as $item) {
                if (!isset($productosExistentes[$item['producto_id']])) {
                    throw new \Exception("El producto ID {$item['producto_id']} no existe");
                }
                $subtotal += $item['precio_unitario'] * $item['cantidad'];
            }
            
            // 4. DETERMINAR TIPO DE ENVÍO Y CALCULAR TOTAL
            $requiereEnvio = $validated['tipo_entrega'] === 'delivery';
            $costoEnvio = $requiereEnvio ? ($validated['costo_envio'] ?? 0) : 0;
            $total = $subtotal + $costoEnvio;
            
            // 5. CONFIGURAR ESTADOS PARA APP MÓVIL
            // En app móvil los pedidos inician como "pendiente" y requieren confirmación del negocio
            $estadoPedido = 'pendiente';
            $estadoMovimiento = 'pendiente';
            $estadoPago = 'pendiente';
            $notaEstado = $requiereEnvio 
                ? 'Pedido pendiente de confirmación - Requiere envío a domicilio'
                : 'Pedido pendiente de confirmación - Cliente recogerá en tienda';
            
            // 6. GENERAR FOLIO ÚNICO PARA EL PEDIDO
            $lastPedido = Pedido::where('sucursal_id', $validated['sucursal_id'])
                ->orderBy('id', 'desc')
                ->first();
            $date = now()->format('Ymd');
            $nextNumber = $lastPedido ? (int)substr($lastPedido->folio, -6) + 1 : 1;
            $folio = "{$sucursal->id}-PEDMOV-{$date}" . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

            // 7. CREAR EL PEDIDO
            $pedido = Pedido::create([
                'folio' => $folio,
                'user_id' => $validated['user_id'], // En móvil usamos user_id como cliente
                'created_by' => $validated['user_id'],
                'sucursal_id' => $validated['sucursal_id'],
                'direccion_entrega' => $validated['direccion_entrega'] ?? null,
                'latitud' => $validated['latitud'] ?? null,
                'longitud' => $validated['longitud'] ?? null,
                'requiere_envio' => $requiereEnvio,
                'distancia_km' => $validated['distancia_km'] ?? null,
                'duracion_minutos' => $validated['tiempo_estimado_min'] ?? null,
                'costo_envio' => $costoEnvio,
                'subtotal' => round($subtotal, 2),
                'total' => round($total, 2),
                'monto_adelanto' => 0,
                'pago_completo' => false,
                'saldo_pendiente' => round($total, 2),
                'notas_pago' => 'Pedido desde app móvil - Pago pendiente',
                'estado_pago' => $estadoPago,
                'estado' => $estadoPedido,
                'fecha_pedido' => now(),
            ]);

            // 8. CREAR DETALLES DEL PEDIDO
            $detallesPedido = [];
            foreach ($validated['productos'] as $producto) {
                $detallesPedido[] = [
                    'pedido_id' => $pedido->id,
                    'product_base_branch_id' => $producto['producto_id'],
                    'cantidad' => $producto['cantidad'],
                    'precio_unitario' => round($producto['precio_unitario'], 2),
                    'subtotal' => round($producto['cantidad'] * $producto['precio_unitario'], 2),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            PedidoDetalle::insert($detallesPedido);

            // 9. REGISTRAR HISTORIAL DE ESTADO INICIAL
            PedidoEstadoHistorial::create([
                'pedido_id' => $pedido->id,
                'estado_anterior' => null,
                'estado_nuevo' => $estadoPedido,
                'notas' => $notaEstado,
            ]);

            // 10. OBTENER ALMACENES ACTIVOS
            $almacenes = Almacen::where('sucursal_id', $validated['sucursal_id'])
                ->where('activo', true)
                ->get();

            if ($almacenes->isEmpty()) {
                throw new \Exception('No se encontraron almacenes activos para esta sucursal');
            }

            // 11. CARGAR STOCK DE PRODUCTOS
            $stockProductos = WarehouseProduct::whereIn('product_base_branch_id', $productoIds)
                ->whereIn('almacen_id', $almacenes->pluck('id'))
                ->get()
                ->groupBy('almacen_id');

            // 12. ASIGNAR PRODUCTOS A ALMACENES
            $asignacionAlmacenes = $this->asignarProductosAAlmacenes(
                $validated['productos'], 
                $almacenes, 
                $stockProductos
            );

            // 13. VERIFICAR STOCK SUFICIENTE
            $productosSinAsignacion = $this->verificarAsignacionCompleta(
                $validated['productos'], 
                $asignacionAlmacenes
            );
            
            if (!empty($productosSinAsignacion)) {
                throw new \Exception("Stock insuficiente para: " . implode(', ', $productosSinAsignacion));
            }

            // 14. GENERAR MOVIMIENTOS DE INVENTARIO (PENDIENTES)
            $movementsCreated = [];
            
            foreach ($asignacionAlmacenes as $almacenId => $productosAlmacen) {
                if (empty($productosAlmacen)) continue;

                $movementNumber = $this->generateMovementNumber($sucursal->id) . "-ALM" . $almacenId;
                $motivoMovimiento = "Reserva por pedido móvil {$folio} - Usuario ID: {$validated['user_id']}";

                // Crear movimiento PENDIENTE (no descuenta stock aún)
                $inventoryMovement = InventoryMovement::create([
                    'almacen_id' => $almacenId,
                    'sucursal_id' => $validated['sucursal_id'],
                    'type' => 'out',
                    'reason' => $motivoMovimiento,
                    'performed_by' => $validated['user_id'],
                    'status' => 'pendiente',
                    'movement_number' => $movementNumber,
                ]);

                $movementsCreated[] = $movementNumber;

                // Crear detalles sin descontar stock
                $detallesMovimiento = [];
                
                foreach ($productosAlmacen as $productoAsignado) {
                    $productoId = $productoAsignado['producto_id'];
                    $cantidad = $productoAsignado['cantidad'];
                    
                    $warehouseProduct = WarehouseProduct::where('product_base_branch_id', $productoId)
                        ->where('almacen_id', $almacenId)
                        ->first();

                    $previousStock = $warehouseProduct ? $warehouseProduct->stock : 0;
                    
                    if ($previousStock < $cantidad) {
                        throw new \Exception("Stock insuficiente para producto ID {$productoId}");
                    }

                    $detallesMovimiento[] = [
                        'inventory_movement_id' => $inventoryMovement->id,
                        'product_base_branch_id' => $productoId,
                        'quantity' => $cantidad,
                        'previous_stock' => $previousStock,
                        'new_stock' => $previousStock, // No descontamos aún
                        'notes' => "Stock reservado - Pedido móvil {$folio} pendiente de confirmación",
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

                InventoryMovementDetail::insert($detallesMovimiento);
            }

            DB::commit();
            
            // 15. RESPUESTA EXITOSA
            return response()->json([
                'success' => true,
                'message' => 'Pedido creado exitosamente. Pendiente de confirmación del negocio.',
                'data' => [
                    'pedido_id' => $pedido->id,
                    'folio' => $pedido->folio,
                    'negocio' => $sucursal->negocio->nombre,
                    'sucursal' => $sucursal->nombre,
                    'tipo_entrega' => $requiereEnvio ? 'delivery' : 'pickup',
                    'subtotal' => $pedido->subtotal,
                    'costo_envio' => $pedido->costo_envio,
                    'total' => $pedido->total,
                    'estado' => $pedido->estado,
                    'estado_pago' => $pedido->estado_pago,
                    'productos_count' => count($validated['productos']),
                    'movimientos_inventario' => $movementsCreated,
                    'fecha_pedido' => $pedido->fecha_pedido->format('Y-m-d H:i:s'),
                ]
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('Error al crear pedido móvil: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al crear el pedido',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crea múltiples pedidos desde la app móvil (uno por cada sucursal)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function crearPedidosMultiples(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'tipo_entrega' => 'required|string|in:pickup,delivery',
            'direccion_entrega' => 'required_if:tipo_entrega,delivery|nullable|string|max:500',
            'latitud' => 'required_if:tipo_entrega,delivery|nullable|numeric|between:-90,90',
            'longitud' => 'required_if:tipo_entrega,delivery|nullable|numeric|between:-180,180',
            
            'pedidos' => 'required|array|min:1',
            'pedidos.*.sucursal_id' => 'required|integer|exists:sucursales,id',
            'pedidos.*.costo_envio' => 'nullable|numeric|min:0',
            'pedidos.*.distancia_km' => 'nullable|numeric|min:0',
            'pedidos.*.tiempo_estimado_min' => 'nullable|integer|min:0',
            'pedidos.*.productos' => 'required|array|min:1',
            'pedidos.*.productos.*.producto_id' => 'required|integer|exists:product_base_branch,id',
            'pedidos.*.productos.*.cantidad' => 'required|integer|min:1|max:1000',
            'pedidos.*.productos.*.precio_unitario' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        
        try {
            $validated = $validator->validated();
            $pedidosCreados = [];
            $totalGeneral = 0;
            $requiereEnvio = $validated['tipo_entrega'] === 'delivery';
            
            foreach ($validated['pedidos'] as $pedidoData) {
                $sucursal = Sucursal::with('negocio')->findOrFail($pedidoData['sucursal_id']);
                
                // Calcular subtotal
                $subtotal = 0;
                $productoIds = collect($pedidoData['productos'])->pluck('producto_id')->unique();
                $productosExistentes = ProductBaseBranch::whereIn('id', $productoIds)->get()->keyBy('id');
                
                foreach ($pedidoData['productos'] as $item) {
                    if (!isset($productosExistentes[$item['producto_id']])) {
                        throw new \Exception("Producto ID {$item['producto_id']} no existe");
                    }
                    $subtotal += $item['precio_unitario'] * $item['cantidad'];
                }
                
                $costoEnvio = $requiereEnvio ? ($pedidoData['costo_envio'] ?? 0) : 0;
                $total = $subtotal + $costoEnvio;
                $totalGeneral += $total;
                
                // Generar folio
                $lastPedido = Pedido::where('sucursal_id', $sucursal->id)
                    ->orderBy('id', 'desc')
                    ->first();
                $date = now()->format('Ymd');
                $nextNumber = $lastPedido ? (int)substr($lastPedido->folio, -6) + 1 : 1;
                $folio = "{$sucursal->id}-PEDMOV-{$date}" . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

                // Crear pedido
                $pedido = Pedido::create([
                    'folio' => $folio,
                    'user_id' => $validated['user_id'],
                    'created_by' => $validated['user_id'],
                    'sucursal_id' => $sucursal->id,
                    'direccion_entrega' => $validated['direccion_entrega'] ?? null,
                    'latitud' => $validated['latitud'] ?? null,
                    'longitud' => $validated['longitud'] ?? null,
                    'requiere_envio' => $requiereEnvio,
                    'distancia_km' => $pedidoData['distancia_km'] ?? null,
                    'duracion_minutos' => $pedidoData['tiempo_estimado_min'] ?? null,
                    'costo_envio' => $costoEnvio,
                    'subtotal' => round($subtotal, 2),
                    'total' => round($total, 2),
                    'monto_adelanto' => 0,
                    'pago_completo' => false,
                    'saldo_pendiente' => round($total, 2),
                    'notas_pago' => 'Pedido desde app móvil - Pago pendiente',
                    'estado_pago' => 'pendiente',
                    'estado' => 'pendiente',
                    'fecha_pedido' => now(),
                ]);

                // Crear detalles
                $detallesPedido = [];
                foreach ($pedidoData['productos'] as $producto) {
                    $detallesPedido[] = [
                        'pedido_id' => $pedido->id,
                        'product_base_branch_id' => $producto['producto_id'],
                        'cantidad' => $producto['cantidad'],
                        'precio_unitario' => round($producto['precio_unitario'], 2),
                        'subtotal' => round($producto['cantidad'] * $producto['precio_unitario'], 2),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                PedidoDetalle::insert($detallesPedido);

                // Historial
                PedidoEstadoHistorial::create([
                    'pedido_id' => $pedido->id,
                    'estado_anterior' => null,
                    'estado_nuevo' => 'pendiente',
                    'notas' => 'Pedido móvil creado - Pendiente de confirmación',
                ]);

                // Movimientos de inventario (igual que en individual)
                $almacenes = Almacen::where('sucursal_id', $sucursal->id)
                    ->where('activo', true)
                    ->get();

                if ($almacenes->isEmpty()) {
                    throw new \Exception("No hay almacenes activos en {$sucursal->nombre}");
                }

                $stockProductos = WarehouseProduct::whereIn('product_base_branch_id', $productoIds)
                    ->whereIn('almacen_id', $almacenes->pluck('id'))
                    ->get()
                    ->groupBy('almacen_id');

                $asignacionAlmacenes = $this->asignarProductosAAlmacenes(
                    $pedidoData['productos'], 
                    $almacenes, 
                    $stockProductos
                );

                $productosSinAsignacion = $this->verificarAsignacionCompleta(
                    $pedidoData['productos'], 
                    $asignacionAlmacenes
                );
                
                if (!empty($productosSinAsignacion)) {
                    throw new \Exception("Stock insuficiente en {$sucursal->nombre}");
                }

                // Crear movimientos pendientes
                foreach ($asignacionAlmacenes as $almacenId => $productosAlmacen) {
                    if (empty($productosAlmacen)) continue;

                    $movementNumber = $this->generateMovementNumber($sucursal->id) . "-ALM" . $almacenId;
                    
                    $inventoryMovement = InventoryMovement::create([
                        'almacen_id' => $almacenId,
                        'sucursal_id' => $sucursal->id,
                        'type' => 'out',
                        'reason' => "Reserva por pedido móvil {$folio}",
                        'performed_by' => $validated['user_id'],
                        'status' => 'pendiente',
                        'movement_number' => $movementNumber,
                    ]);

                    $detallesMovimiento = [];
                    foreach ($productosAlmacen as $productoAsignado) {
                        $warehouseProduct = WarehouseProduct::where('product_base_branch_id', $productoAsignado['producto_id'])
                            ->where('almacen_id', $almacenId)
                            ->first();

                        $detallesMovimiento[] = [
                            'inventory_movement_id' => $inventoryMovement->id,
                            'product_base_branch_id' => $productoAsignado['producto_id'],
                            'quantity' => $productoAsignado['cantidad'],
                            'previous_stock' => $warehouseProduct->stock,
                            'new_stock' => $warehouseProduct->stock,
                            'notes' => "Reserva - Pedido {$folio}",
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                    InventoryMovementDetail::insert($detallesMovimiento);
                }

                $pedidosCreados[] = [
                    'pedido_id' => $pedido->id,
                    'folio' => $pedido->folio,
                    'negocio' => $sucursal->negocio->nombre,
                    'sucursal' => $sucursal->nombre,
                    'subtotal' => $pedido->subtotal,
                    'costo_envio' => $pedido->costo_envio,
                    'total' => $pedido->total,
                    'productos_count' => count($pedidoData['productos']),
                ];
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => count($pedidosCreados) . ' pedidos creados exitosamente',
                'data' => [
                    'pedidos' => $pedidosCreados,
                    'total_pedidos' => count($pedidosCreados),
                    'total_general' => round($totalGeneral, 2),
                    'tipo_entrega' => $validated['tipo_entrega'],
                    'fecha_pedidos' => now()->format('Y-m-d H:i:s'),
                ]
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Error al crear los pedidos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Métodos auxiliares (misma lógica que en la web)
    private function asignarProductosAAlmacenes($productos, $almacenes, $stockProductos)
    {
        $asignacion = [];
        foreach ($almacenes as $almacen) {
            $asignacion[$almacen->id] = [];
        }

        foreach ($productos as $producto) {
            $productoId = $producto['producto_id'];
            $cantidadNecesaria = $producto['cantidad'];
            $asignado = false;

            foreach ($almacenes as $almacen) {
                $stockEnAlmacen = $stockProductos->get($almacen->id, collect())
                    ->where('product_base_branch_id', $productoId)
                    ->first();

                $stockDisponible = $stockEnAlmacen ? $stockEnAlmacen->stock : 0;

                if ($stockDisponible >= $cantidadNecesaria) {
                    $asignacion[$almacen->id][] = [
                        'producto_id' => $productoId,
                        'cantidad' => $cantidadNecesaria
                    ];
                    $asignado = true;
                    break;
                }
            }

            if (!$asignado) {
                $cantidadRestante = $cantidadNecesaria;
                foreach ($almacenes as $almacen) {
                    if ($cantidadRestante <= 0) break;

                    $stockEnAlmacen = $stockProductos->get($almacen->id, collect())
                        ->where('product_base_branch_id', $productoId)
                        ->first();

                    $stockDisponible = $stockEnAlmacen ? $stockEnAlmacen->stock : 0;

                    if ($stockDisponible > 0) {
                        $cantidadAAsignar = min($stockDisponible, $cantidadRestante);
                        $asignacion[$almacen->id][] = [
                            'producto_id' => $productoId,
                            'cantidad' => $cantidadAAsignar
                        ];
                        $cantidadRestante -= $cantidadAAsignar;
                    }
                }

                if ($cantidadRestante > 0) {
                    throw new \Exception("Stock insuficiente para producto ID {$productoId}");
                }
            }
        }

        return $asignacion;
    }

    private function verificarAsignacionCompleta($productos, $asignacionAlmacenes)
    {
        $productosSinAsignar = [];
        $cantidadesRequeridas = [];
        
        foreach ($productos as $producto) {
            $productoId = $producto['producto_id'];
            $cantidadesRequeridas[$productoId] = ($cantidadesRequeridas[$productoId] ?? 0) + $producto['cantidad'];
        }

        $cantidadesAsignadas = [];
        foreach ($asignacionAlmacenes as $productosAlmacen) {
            foreach ($productosAlmacen as $productoAsignado) {
                $productoId = $productoAsignado['producto_id'];
                $cantidadesAsignadas[$productoId] = ($cantidadesAsignadas[$productoId] ?? 0) + $productoAsignado['cantidad'];
            }
        }

        foreach ($cantidadesRequeridas as $productoId => $cantidadRequerida) {
            $cantidadAsignada = $cantidadesAsignadas[$productoId] ?? 0;
            if ($cantidadAsignada < $cantidadRequerida) {
                $productosSinAsignar[] = "ID {$productoId} (faltan " . ($cantidadRequerida - $cantidadAsignada) . ")";
            }
        }

        return $productosSinAsignar;
    }

    private function generateMovementNumber($sucursalId)
    {
        $prefix = 'PEDMOV';
        $date = now()->format('Ymd');
        $count = InventoryMovement::whereDate('created_at', today())
            ->where('sucursal_id', $sucursalId)
            ->count() + 1;
        
        return "{$sucursalId}-{$prefix}-{$date}-" . str_pad($count, 6, '0', STR_PAD_LEFT);
    }
    

}