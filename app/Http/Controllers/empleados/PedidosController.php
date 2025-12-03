<?php

namespace App\Http\Controllers\empleados;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\NegocioCliente;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Vehiculo;
use App\Models\Pedido;
use App\Models\PedidoDetalle;
use App\Models\PedidoEstadoHistorial;
use App\Models\ViajePedido;
use App\Models\ProductBaseBranch;
use App\Models\Almacen;
use App\Models\InventoryMovement;
use App\Models\InventoryMovementDetail;
use App\Models\WarehouseProduct;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class PedidosController extends Controller
{
    //view
    public function crearPedidoLocal(string|int $clienteId)
    {
        $sucursal = auth()->user()->sucursales()->first();
        $cliente = NegocioCliente::with('direcciones_cliente')->where('id',$clienteId)->first();
        $vehiculos = Vehiculo::where('sucursal_id', $sucursal->id)->get(); 

        if(!$cliente){
            return redirect()->back()->with('error','Cliente no encontrado');
        }

        if($cliente->negocio_id !== $sucursal->negocio_id){
            return redirect()->back()->with('error','El cliente no pertenece a esta sucursal');
        }

        return Inertia::render('empleados/pedidos/create',[
            'sucursal' => $sucursal,
            'cliente' => $cliente,
            'vehiculos' => $vehiculos,
        ]);
    }

   public function store(Request $request)
    {
        //dd($request->all());
        // Validación de datos
        $validated = $request->validate([
            // Datos básicos del pedido
            'cliente_id' => 'required|exists:negocio_clientes,id',
            'sucursal_id' => 'required|exists:sucursales,id',
            
            // Dirección de entrega
            'direccion_entrega' => 'nullable|string|max:500',
            'direccion_id' => 'nullable|integer',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            
            // Datos de transporte/envío
            'requiere_envio' => 'required|boolean',
            'distancia_km' => 'nullable|numeric|min:0',
            'duracion_minutos' => 'nullable|integer|min:0',
            'costo_envio' => 'nullable|numeric|min:0',
            
            // Productos
            'productos' => 'required|array|min:1',
            'productos.*.producto_id' => 'required|integer',
            'productos.*.cantidad' => 'required|integer|min:1',
            'productos.*.precio_unitario' => 'required|numeric|min:0',
            
            // Totales
            'subtotal' => 'required|numeric|min:0',
            'total' => 'required|numeric|min:0',
            
            // Datos de pago
            'monto_adelanto' => 'nullable|numeric|min:0',
            'pago_completo' => 'required|boolean',
            'saldo_pendiente' => 'nullable|numeric|min:0',
            'notas_pago' => 'nullable|string|max:1000',
            'metodo_pago_adelanto' => 'nullable|string|in:efectivo,tarjeta,transferencia,otro',
            'estado_pago' => 'required|string|in:pendiente,adelanto,pagado'
        ]);

        // Validaciones adicionales
        $sucursal = auth()->user()->sucursales()->first();
        $errors = [];

        if (!$sucursal) {
            return redirect()->back()->withErrors(['sucursal_id' => 'Sucursal no encontrada o no autorizada'])->withInput();
        }

        // Validar cliente
        $cliente = NegocioCliente::where('id', $validated['cliente_id'])->first();
        if (!$cliente || $cliente->negocio_id !== $sucursal->negocio_id) {
            return redirect()->back()->withErrors(['cliente_id' => 'Cliente no válido'])->withInput();
        }

        // Obtener IDs de productos para validaciones
        $productoIds = collect($validated['productos'])->pluck('producto_id')->unique();

        // Validar productos y cálculos
        $expectedSubtotal = 0.0;
        $productosExistentes = ProductBaseBranch::whereIn('id', $productoIds)->get()->keyBy('id');
        
        foreach ($validated['productos'] as $idx => $prod) {
            if (!isset($productosExistentes[$prod['producto_id']])) {
                $errors["productos.$idx.producto_id"] = "El producto no existe";
                continue;
            }
            $expectedSubtotal += ($prod['cantidad'] * $prod['precio_unitario']);
        }

        if (abs($expectedSubtotal - (float)$validated['subtotal']) > 0.01) {
            $errors['subtotal'] = 'El subtotal no coincide';
        }

        $expectedTotal = $expectedSubtotal + ((float)($validated['costo_envio'] ?? 0));
        if (abs($expectedTotal - (float)$validated['total']) > 0.01) {
            $errors['total'] = 'El total no coincide';
        }

        // Validar pagos
        $montoAdelanto = (float)($validated['monto_adelanto'] ?? 0);
        $pagoCompleto = (bool)$validated['pago_completo'];
        
        if ($pagoCompleto && abs($montoAdelanto - (float)$validated['total']) > 0.01) {
            $errors['monto_adelanto'] = 'El adelanto debe ser igual al total';
        }

        if (!empty($errors)) {
            return redirect()->back()->withErrors($errors)->withInput();
        }

        // Determinar estados basados en el pago
        $requiereEnvio = (bool)$validated['requiere_envio'];
        
        // Lógica de estados del pedido:
        if ($pagoCompleto && !$requiereEnvio) {
            $estadoPedido = 'entregado';
            $estadoMovimiento = 'completado';
            $notaEstado = 'Pedido completado - Pago recibido, cliente recoge en tienda';
        } elseif ($pagoCompleto && $requiereEnvio) {
            $estadoPedido = 'confirmado';
            $estadoMovimiento = 'completado';
            $notaEstado = 'Pedido confirmado - Pago recibido, pendiente de envío';
        } else {
            $estadoPedido = 'pendiente';
            $estadoMovimiento = 'pendiente';
            $notaEstado = 'Pedido pendiente - Esperando confirmación del pedido';
        }

        // Iniciar transacción
        DB::beginTransaction();
        
        try {
            // 1. Generar folio único para el pedido
            $lastPedido = Pedido::where('sucursal_id', $validated['sucursal_id'])
                ->orderBy('id', 'desc')
                ->first();
            $date = now()->format('Ymd');
            $nextNumber = $lastPedido ? (int)substr($lastPedido->folio, -6) + 1 : 1;
            $folio = "{$sucursal->id}-PED-{$date}" . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

            // 2. Crear el pedido
            $pedido = Pedido::create([
                'folio' => $folio,
                'user_id' => auth()->id(),
                'cliente_id' => $validated['cliente_id'],
                'created_by' => auth()->id(),
                'sucursal_id' => $validated['sucursal_id'],
                'direccion_entrega' => $validated['direccion_entrega'],
                'latitud' => $validated['latitud'] ?? null,
                'longitud' => $validated['longitud'] ?? null,
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
                'estado_pago' => $validated['estado_pago'],
                'estado' => $estadoPedido,
                'fecha_pedido' => now(),
            ]);

            // 3. Crear detalles del pedido
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

            // 4. Registrar historial de estado inicial
            PedidoEstadoHistorial::create([
                'pedido_id' => $pedido->id,
                'estado_anterior' => null,
                'estado_nuevo' => $estadoPedido,
                'notas' => $notaEstado,
            ]);

            // 5. Obtener todos los almacenes activos de la sucursal
            $almacenes = Almacen::where('sucursal_id', $validated['sucursal_id'])
                ->where('activo', true)
                ->get();

            if ($almacenes->isEmpty()) {
                throw new \Exception('No se encontraron almacenes activos para esta sucursal');
            }

            // 6. Cargar stock de todos los productos en todos los almacenes
            $stockProductos = WarehouseProduct::whereIn('product_base_branch_id', $productoIds)
                ->whereIn('almacen_id', $almacenes->pluck('id'))
                ->get()
                ->groupBy('almacen_id');

            // 7. Asignar productos a almacenes y agrupar por almacén
            $asignacionAlmacenes = $this->asignarProductosAAlmacenes($validated['productos'], $almacenes, $stockProductos);

            // 8. Verificar que todos los productos tengan asignación
            $productosSinAsignacion = $this->verificarAsignacionCompleta($validated['productos'], $asignacionAlmacenes);
            
            if (!empty($productosSinAsignacion)) {
                throw new \Exception("No hay stock suficiente para los productos: " . implode(', ', $productosSinAsignacion));
            }

            // 9. Generar movimientos de inventario por almacén
            $movementsCreated = [];
            
            foreach ($asignacionAlmacenes as $almacenId => $productosAlmacen) {
                if (empty($productosAlmacen)) continue;

                // Generar número de movimiento único para este almacén
                $movementNumber = $this->generateMovementNumber($sucursal->id) . "-ALM" . $almacenId;

                // Crear motivo del movimiento
                $motivoMovimiento = $pagoCompleto 
                    ? "Salida completada por pedido {$folio} - Cliente: {$cliente->nombre}"
                    : "Salida reservada por pedido {$folio} - Cliente: {$cliente->nombre}";

                // Crear movimiento de inventario para este almacén
                $inventoryMovement = InventoryMovement::create([
                    'almacen_id' => $almacenId,
                    'sucursal_id' => $validated['sucursal_id'],
                    'type' => 'out',
                    'reason' => $motivoMovimiento,
                    'performed_by' => auth()->id(),
                    'status' => $estadoMovimiento,
                    'movement_number' => $movementNumber,
                ]);

                $movementsCreated[] = $movementNumber;

                // Crear detalles del movimiento para este almacén
                $detallesMovimiento = [];
                
                foreach ($productosAlmacen as $productoAsignado) {
                    $productoId = $productoAsignado['producto_id'];
                    $cantidad = $productoAsignado['cantidad'];
                    
                    // Buscar el warehouse product
                    $warehouseProduct = WarehouseProduct::where('product_base_branch_id', $productoId)
                        ->where('almacen_id', $almacenId)
                        ->first();

                    $previousStock = $warehouseProduct ? $warehouseProduct->stock : 0;
                    
                    // Si el movimiento está completado, descontar el stock inmediatamente
                    if ($estadoMovimiento === 'completado') {
                        $newStock = $previousStock - $cantidad;
                        
                        // Validar que hay stock suficiente
                        if ($newStock < 0) {
                            throw new \Exception("Stock insuficiente para el producto ID {$productoId} en almacén {$almacenId}. Stock disponible: {$previousStock}, solicitado: {$cantidad}");
                        }
                        
                        // Actualizar el stock en el almacén
                        if ($warehouseProduct) {
                            $warehouseProduct->stock = $newStock;
                            $warehouseProduct->save();
                        }
                        
                        // Recalcular el stock total del producto en la sucursal
                        $productBaseBranch = $productosExistentes[$productoId];
                        $productBaseBranch->recalculateStockFromWarehouses();
                        
                        $notasDetalle = "Stock descontado - Pedido {$folio}";
                    } else {
                        // Si está pendiente, no descontar el stock aún
                        $newStock = $previousStock;
                        $notasDetalle = "Stock reservado - Pedido {$folio} pendiente";
                    }

                    $detallesMovimiento[] = [
                        'inventory_movement_id' => $inventoryMovement->id,
                        'product_base_branch_id' => $productoId,
                        'quantity' => $cantidad,
                        'previous_stock' => $previousStock,
                        'new_stock' => $newStock,
                        'notes' => $notasDetalle,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

                // Insertar detalles en lote
                InventoryMovementDetail::insert($detallesMovimiento);
            }

            // Commit de la transacción
            DB::commit();

            // Preparar mensaje de éxito
            $mensajeExito = "Pedido {$folio} creado exitosamente. ";
            $mensajeExito .= "Movimientos de inventario generados: " . implode(', ', $movementsCreated) . ". ";
            
            if ($estadoMovimiento === 'completado') {
                $mensajeExito .= "Stock actualizado en los almacenes.";
            } else {
                $mensajeExito .= "Movimientos en estado pendiente.";
            }

            return redirect()->back()->with('success', $mensajeExito);

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('Error al crear pedido: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return redirect()
                ->back()
                ->withErrors(['error' => 'Error al crear el pedido: ' . $e->getMessage()]);
        }
    }

    /**
     * Asigna productos a almacenes buscando el que tenga stock suficiente
     */
    private function asignarProductosAAlmacenes($productos, $almacenes, $stockProductos)
    {
        $asignacion = [];
        
        // Inicializar estructura por almacén
        foreach ($almacenes as $almacen) {
            $asignacion[$almacen->id] = [];
        }

        foreach ($productos as $producto) {
            $productoId = $producto['producto_id'];
            $cantidadNecesaria = $producto['cantidad'];
            $asignado = false;

            // Primero buscar almacén con stock suficiente completo
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

            // Si no se encontró almacén con stock completo, distribuir entre varios
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

                // Si después de distribuir todavía queda cantidad, no está completamente asignado
                if ($cantidadRestante > 0) {
                    throw new \Exception("Stock insuficiente para el producto ID {$productoId}. Se necesitan {$cantidadNecesaria} unidades, pero solo hay " . ($cantidadNecesaria - $cantidadRestante) . " disponibles en todos los almacenes.");
                }
            }
        }

        return $asignacion;
    }

    /**
     * Verifica que todos los productos tengan asignación completa
     */
    private function verificarAsignacionCompleta($productos, $asignacionAlmacenes)
    {
        $productosSinAsignar = [];
        
        // Calcular cantidades totales requeridas por producto
        $cantidadesRequeridas = [];
        foreach ($productos as $producto) {
            $productoId = $producto['producto_id'];
            $cantidadesRequeridas[$productoId] = ($cantidadesRequeridas[$productoId] ?? 0) + $producto['cantidad'];
        }

        // Calcular cantidades asignadas por producto
        $cantidadesAsignadas = [];
        foreach ($asignacionAlmacenes as $productosAlmacen) {
            foreach ($productosAlmacen as $productoAsignado) {
                $productoId = $productoAsignado['producto_id'];
                $cantidadesAsignadas[$productoId] = ($cantidadesAsignadas[$productoId] ?? 0) + $productoAsignado['cantidad'];
            }
        }

        // Verificar productos sin asignación completa
        foreach ($cantidadesRequeridas as $productoId => $cantidadRequerida) {
            $cantidadAsignada = $cantidadesAsignadas[$productoId] ?? 0;
            if ($cantidadAsignada < $cantidadRequerida) {
                $productosSinAsignar[] = "Producto ID {$productoId} (faltan " . ($cantidadRequerida - $cantidadAsignada) . " unidades)";
            }
        }

        return $productosSinAsignar;
    }

    private function generateMovementNumber(string | int $sucursalId): string
    {
        $prefix = 'PED';

        $date = now()->format('Ymd');
        
        // Contar movimientos del día
        $count = InventoryMovement::whereDate('created_at', today())->where('sucursal_id',$sucursalId)->count() + 1;
        
        return "{$sucursalId}-{$prefix}-{$date}-" . str_pad($count, 6, '0', STR_PAD_LEFT);
    }


    /**
     * Mostrar pedidos activos (pendientes, confirmados, en proceso)
     * Excluye pedidos cancelados y entregados
     */
    public function index(Request $request)
    {        
        
        // Sucursal seleccionada (por defecto la primera)
        $sucursal = auth()->user()->sucursales()->first();
        
        // Query base de pedidos activos
        $query = Pedido::with([
                'cliente:id,nombre,apellidos,telefono',
                'sucursal:id,nombre',
                'user:id,name,email',
                'creador:id,name',
            ])
            ->whereIn('estado', ['pendiente', 'confirmado', 'en_preparacion', 'listo_para_envio', 'en_camino', 'completado'])
            ->orderBy('created_at', 'desc');
        
        // Filtrar por sucursal si está seleccionada
        if ($sucursal) {
            $query->where('sucursal_id', $sucursal->id);
        } else {
            return redirect()->back()->with('error', 'No se encontró una sucursal asociada al usuario.');
        }
        
        // Filtros adicionales
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }
        
        if ($request->filled('estado_pago')) {
            $query->where('estado_pago', $request->estado_pago);
        }
        
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('folio', 'like', "%{$search}%")
                ->orWhereHas('cliente', function($clienteQ) use ($search) {
                    $clienteQ->where('nombre', 'like', "%{$search}%")
                            ->orWhere('apellidos', 'like', "%{$search}%")
                            ->orWhere('telefono', 'like', "%{$search}%");
                });
            });
        }
        
        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha_pedido', '>=', $request->fecha_desde);
        }
        
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha_pedido', '<=', $request->fecha_hasta);
        }
        
        if ($request->filled('requiere_envio')) {
            $query->where('requiere_envio', $request->requiere_envio === 'true');
        }
        
        // Paginación
        $pedidos = $query->paginate(15)->withQueryString();
        
        // Estadísticas rápidas de pedidos activos
        $estadisticas = [
            'total_activos' => Pedido::whereIn('estado', ['pendiente', 'confirmado', 'en_preparacion', 'listo_para_envio', 'en_camino', 'completado'])
                ->when($sucursal->id, fn($q) => $q->where('sucursal_id', $sucursal->id))
                ->count(),
            'pendientes' => Pedido::where('estado', 'pendiente')
                ->when($sucursal->id, fn($q) => $q->where('sucursal_id', $sucursal->id))
                ->count(),
            'confirmados' => Pedido::where('estado', 'confirmado')
                ->when($sucursal->id, fn($q) => $q->where('sucursal_id', $sucursal->id))
                ->count(),
            'en_camino' => Pedido::where('estado', 'en_camino')
                ->when($sucursal->idd, fn($q) => $q->where('sucursal_id', $sucursal->id))
                ->count(),
            'total_por_cobrar' => Pedido::whereIn('estado', ['pendiente', 'confirmado', 'en_preparacion', 'listo_para_envio', 'en_camino', 'completado'])
                ->where('estado_pago', '!=', 'pagado')
                ->when($sucursal->id, fn($q) => $q->where('sucursal_id', $sucursal->id))
                ->sum('saldo_pendiente'),
        ];
        
        return inertia('empleados/pedidos/index', [
            'pedidos' => $pedidos,
            'sucursal_actual' => $sucursal,
            'estadisticas' => $estadisticas,
            'filters' => $request->only(['sucursal_id', 'estado', 'estado_pago', 'search', 'fecha_desde', 'fecha_hasta', 'requiere_envio']),
        ]);
    }


    /**
     * Mostrar historial completo de pedidos (cancelados y entregados)
     * Incluye todos los estados para consulta histórica
     */
    public function historial(Request $request)
    {
        $user = auth()->user();
        
        // Obtener sucursal del usuario
        $sucursal = $user->sucursales()->first();
        
        if (!$sucursal) {
            return redirect()->back()->with('error', 'No tienes sucursales asignadas');
        }
        
        // Query base - solo pedidos completados y cancelados
        $query = Pedido::with([
                'cliente:id,nombre,apellidos,telefono',
                'user:id,name',
            ])
            ->where('sucursal_id', $sucursal->id)
            ->whereIn('estado', ['entregado', 'cancelado'])
            ->orderBy('created_at', 'desc');
        
        // Filtro de búsqueda
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('folio', 'like', "%{$search}%")
                ->orWhereHas('cliente', function($clienteQ) use ($search) {
                    $clienteQ->where('nombre', 'like', "%{$search}%")
                            ->orWhere('apellidos', 'like', "%{$search}%")
                            ->orWhere('telefono', 'like', "%{$search}%");
                });
            });
        }
        
        // Filtro por estado (entregado o cancelado)
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }
        
        // Filtro por estado de pago
        if ($request->filled('estado_pago')) {
            $query->where('estado_pago', $request->estado_pago);
        }
        
        // Filtro por fecha desde
        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha_pedido', '>=', $request->fecha_desde);
        } else {
            // Por defecto, mostrar últimos 3 meses
            $query->whereDate('fecha_pedido', '>=', now()->subMonths(3));
        }
        
        // Filtro por fecha hasta
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha_pedido', '<=', $request->fecha_hasta);
        }
        
        // Filtro por tipo de entrega
        if ($request->filled('requiere_envio')) {
            $query->where('requiere_envio', $request->requiere_envio === 'true' || $request->requiere_envio === '1');
        }
        
        // Filtro por rango de montos
        if ($request->filled('monto_min')) {
            $query->where('total', '>=', $request->monto_min);
        }
        
        if ($request->filled('monto_max')) {
            $query->where('total', '<=', $request->monto_max);
        }
        
        // Paginación con filtros preservados
        $pedidos = $query->paginate(20)
            ->withQueryString()
            ->through(function ($pedido) {
                return [
                    'id' => $pedido->id,
                    'folio' => $pedido->folio,
                    'fecha_pedido' => $pedido->fecha_pedido 
                        ? \Carbon\Carbon::parse($pedido->fecha_pedido)->format('d/m/Y')
                        : null,
                    'fecha_entrega' => $pedido->fecha_entrega 
                        ? \Carbon\Carbon::parse($pedido->fecha_entrega)->format('d/m/Y')
                        : null,
                    'cliente_nombre' => $pedido->cliente 
                        ? trim($pedido->cliente->nombre . ' ' . $pedido->cliente->apellidos)
                        : 'Cliente general',
                    'cliente_telefono' => $pedido->cliente?->telefono,
                    'estado' => $pedido->estado,
                    'estado_pago' => $pedido->estado_pago,
                    'requiere_envio' => $pedido->requiere_envio,
                    'total' => $pedido->total,
                    'monto_adelanto' => $pedido->monto_adelanto,
                    'saldo_pendiente' => $pedido->saldo_pendiente,
                    'atendido_por' => $pedido->user?->name ?? 'Sistema',
                    'created_at' => $pedido->created_at->format('d/m/Y H:i'),
                ];
            });
        
        // Calcular rango de fechas actual
        $fechaDesde = $request->filled('fecha_desde') 
            ? $request->fecha_desde 
            : now()->subMonths(3)->format('Y-m-d');
            
        $fechaHasta = $request->filled('fecha_hasta') 
            ? $request->fecha_hasta 
            : now()->format('Y-m-d');
        
        return inertia('empleados/pedidos/historial-pedidos', [
            'pedidos' => $pedidos,
            'sucursal' => [
                'id' => $sucursal->id,
                'nombre' => $sucursal->nombre,
            ],
            'filters' => $request->only([
                'estado', 
                'estado_pago', 
                'search', 
                'fecha_desde', 
                'fecha_hasta', 
                'requiere_envio',
                'monto_min',
                'monto_max',
            ]),
            'fecha_rango' => [
                'desde' => $fechaDesde,
                'hasta' => $fechaHasta,
            ],
        ]);
    }

    /**
     * Mostrar detalles completos de un pedido específico
     * Incluye detalles de productos, envío e información de vehículos disponibles
     */
    public function show(Pedido $pedido)
    {
        $user = auth()->user();
        $sucursal = $user->sucursales()->first();
        $drivers = \App\Models\User::whereHas('sucursales', function($q) use ($sucursal) {
            $q->where('sucursal_id', $sucursal->id);
        })->where(function($q) {
            // Soporta varios esquemas comunes: columna "role", "type" o flag booleano "is_driver"
            $q->Where('type', 'driver');
        })->select('id', 'name', 'email')->get();
        
        // Verificar que el pedido pertenece a la sucursal del usuario
        if ($pedido->sucursal_id !== $sucursal->id) {
            abort(403, 'No tienes permiso para ver este pedido');
        }
        
        // Cargar información relacionada
        $pedido->load([
            'cliente:id,nombre,apellidos,telefono',
            'sucursal:id,nombre',
            'user:id,name,email,phone',//cliente el que creo el pedido en linea
            'creador:id,name',
            'detalles.productBaseBranch.productBase:id,name,sku_base',
            'statusHistories:id,pedido_id,estado_anterior,estado_nuevo,created_at'
        ]);
        
        // Obtener vehículos disponibles de la sucursal para vinculación
        $vehiculos = Vehiculo::where('sucursal_id', $sucursal->id)
            ->where('estado', 'activo')
            ->select('id', 'placa', 'marca', 'modelo', 'color', 'tipo', 'capacidad_carga_kg', 'estado')
            ->get();
        
        // Cargar viajes/assignaciones existentes para este pedido
        $viaje = ViajePedido::where('pedido_id', $pedido->id)
            ->with(['vehiculo:id,placa,marca,modelo,color,tipo,capacidad_carga_kg', 'conductor:id,name'])
            ->first();

        return Inertia::render('empleados/pedidos/detalle-pedido', [
            'pedido' => $pedido,
            'vehiculos' => $vehiculos,
            'sucursal' => $sucursal,
            'viaje' => $viaje,
            'drivers' => $drivers,
        ]);
    }

    /**
     * Asignar un vehículo a un pedido -> crea registro en viaje_pedidos
     */

    public function asignarVehiculo(Request $request, Pedido $pedido)
    {
        $request->validate([
            'vehiculo_id' => 'required|integer|exists:vehiculos,id',
            'conductor_id' => 'nullable|integer|exists:users,id',
            'estado' => 'nullable|string|in:asignado,en_camino,entregado,cancelado',
            'fecha_asignacion' => 'nullable|date',
            'fecha_salida' => 'nullable|date|after_or_equal:fecha_asignacion',
            'fecha_entrega' => 'nullable|date|after_or_equal:fecha_salida',
        ]);

        $user = auth()->user();
        
        // Verificar que el usuario tenga una sucursal asignada
        $sucursal = $user->sucursales()->first();
        if (!$sucursal) {
            abort(403, 'Usuario no tiene una sucursal asignada');
        }

        // Verificar que el pedido pertenezca a la sucursal del usuario
        if ($pedido->sucursal_id !== $sucursal->id) {
            abort(403, 'No tienes permiso para modificar este pedido');
        }

        // Verificar vehículo pertenece a la sucursal y está activo
        $vehiculo = Vehiculo::where('id', $request->vehiculo_id)
            ->where('sucursal_id', $sucursal->id)
            ->where('estado', 'activo')
            ->first();

        if (!$vehiculo) {
            return redirect()->back()->with('error', 'Vehículo no encontrado o no disponible');
        }

        // Verificar conductor si se proporciona
        if ($request->conductor_id) {
            $conductor = User::where('id', $request->conductor_id)
                ->first();

            if (!$conductor) {
                return redirect()->back()->with('error', 'Conductor no encontrado o no disponible');
            }
            
            $conductor->sucursales()->where('sucursal_id', $sucursal->id)->exists();
            if (!$conductor) {
                return redirect()->back()->with('error', 'El conductor no está asignado a la sucursal del usuario');
            }
            
        }

        // Verificar que el pedido esté en un estado válido para asignar vehículo
        $estadosValidos = ['pendiente', 'confirmado', 'en_preparacion'];
        if (!in_array($pedido->estado, $estadosValidos)) {
            return redirect()->back()->with('error', 'El pedido no puede asignarse a un vehículo en su estado actual: ' . $pedido->estado);
        }

        // Verificar que no exista ya un viaje activo para este pedido
        $viajeExistente = ViajePedido::where('pedido_id', $pedido->id)
            ->whereIn('estado', ['asignado', 'en_camino'])
            ->first();

        if ($viajeExistente) {
            return redirect()->back()->with('error', 'Este pedido ya tiene un viaje activo');
        }

        DB::beginTransaction();
        try {
            // Determinar el estado del pedido basado en el estado del viaje
            $estadoPedidoMap = [
                'asignado' => 'en_preparacion',
                'en_camino' => 'en_camino', 
                'entregado' => 'entregado'
            ];

            $estadoViaje = $request->estado ?? 'asignado';
            $nuevoEstadoPedido = 'en_preparacion';

            // Crear viaje/pedido (asignación)
            $viajeData = [
                'pedido_id' => $pedido->id,
                'vehiculo_id' => $vehiculo->id,
                'conductor_id' => $request->conductor_id,
                'estado' => $estadoViaje,
                'fecha_asignacion' => $request->fecha_asignacion ?: now(),
                'fecha_salida' => $request->fecha_salida,
                'fecha_entrega' => $request->fecha_entrega,
            ];

            // Limpiar valores nulos
            $viajeData = array_filter($viajeData, function($value) {
                return !is_null($value);
            });

            $viaje = ViajePedido::create($viajeData);

            // Registrar cambio de estado del pedido si es diferente
            if ($pedido->estado !== $nuevoEstadoPedido) {
                $estadoAnterior = $pedido->estado;
                $pedido->estado = $nuevoEstadoPedido;
                $pedido->save();

                PedidoEstadoHistorial::create([
                    'pedido_id' => $pedido->id,
                    'estado_anterior' => $estadoAnterior,
                    'estado_nuevo' => $nuevoEstadoPedido,
                    'notas' => "Asignado vehículo ID {$vehiculo->id} (placa: {$vehiculo->placa})" . 
                            ($request->conductor_id ? " con conductor ID {$request->conductor_id}" : ""),
                ]);
            }

            DB::commit();

            return redirect()->back()->with('success', 'Vehículo asignado al pedido correctamente');

        } catch (\Exception $e) {
            DB::rollBack();
            // Log::error('Error al asignar vehículo al pedido: ' . $e->getMessage(), [
            //     'pedido_id' => $pedido->id,
            //     'vehiculo_id' => $request->vehiculo_id,
            //     'conductor_id' => $request->conductor_id,
            //     'user_id' => $user->id
            // ]);
            
            return redirect()->back()->with('error', 'Error al asignar vehículo: ' . $e->getMessage());
        }
    }

    /**
     * Actualizar la asignación de un vehículo a un pedido existente
     * Modifica los datos del viaje/asignación de vehículo
     */
    public function actualizarAsignacion(Request $request, Pedido $pedido)
    {
        $request->validate([
            'vehiculo_id' => 'required|integer|exists:vehiculos,id',
            'conductor_id' => 'nullable|integer|exists:users,id',
            'estado' => 'required|string|in:asignado,en_ruta,entregado,cancelado',
            'fecha_asignacion' => 'nullable|date',
            'fecha_salida' => 'nullable|date|after_or_equal:fecha_asignacion',
            'fecha_entrega' => 'nullable|date|after_or_equal:fecha_salida',
        ]);

        $user = auth()->user();
        
        // Verificar que el usuario tenga una sucursal asignada
        $sucursal = $user->sucursales()->first();
        if (!$sucursal) {
            return redirect()->back()->with('error', 'Usuario no tiene una sucursal asignada');
        }

        // Verificar que el pedido pertenezca a la sucursal del usuario
        if ($pedido->sucursal_id !== $sucursal->id) {
            return redirect()->back()->with('error', 'No tienes permiso para modificar este pedido');
        }

        // Verificar vehículo pertenece a la sucursal y está activo
        $vehiculo = Vehiculo::where('id', $request->vehiculo_id)
            ->where('sucursal_id', $sucursal->id)
            ->where('estado', 'activo')
            ->first();

        if (!$vehiculo) {
            return redirect()->back()->with('error', 'Vehículo no encontrado o no disponible');
        }

        // Verificar conductor si se proporciona
        if ($request->conductor_id) {
            $conductor = User::where('id', $request->conductor_id)->first();

            if (!$conductor) {
                return redirect()->back()->with('error', 'Conductor no encontrado o no disponible');
            }
            
            // Verificar que el conductor pertenezca a la sucursal
            $conductorEnSucursal = $conductor->sucursales()->where('sucursal_id', $sucursal->id)->exists();
            if (!$conductorEnSucursal) {
                return redirect()->back()->with('error', 'El conductor no está asignado a la sucursal del usuario');
            }
        }

        // Obtener el viaje existente
        $viaje = ViajePedido::where('pedido_id', $pedido->id)->first();
        
        if (!$viaje) {
            return redirect()->back()->with('error', 'No hay una asignación de vehículo para este pedido');
        }

        DB::beginTransaction();
        try {
            // Guardar estado anterior del viaje para referencia
            $estadoViajeAnterior = $viaje->estado;
            $estadoPedidoAnterior = $pedido->estado;

            // Mapeo de estados de viaje a estados de pedido
            $estadoPedidoMap = [
                'asignado' => 'en_preparacion',
                'en_ruta' => 'en_ruta',
                'entregado' => 'entregado',
                'cancelado' => 'cancelado'
            ];

            $estadoViajeNuevo = $request->estado;
            $nuevoEstadoPedido = $estadoPedidoMap[$estadoViajeNuevo];

            // Validar transiciones de estado permitidas
            $transicionesValidas = $this->validarTransicionEstado($pedido->estado, $nuevoEstadoPedido);
            
            if (!$transicionesValidas['valido']) {
                DB::rollBack();
                return redirect()->back()->with('error', $transicionesValidas['mensaje']);
            }

            // Actualizar los datos del viaje
            $viaje->update([
                'vehiculo_id' => $request->vehiculo_id,
                'conductor_id' => $request->conductor_id,
                'estado' => $estadoViajeNuevo,
                'fecha_asignacion' => $request->fecha_asignacion ?: $viaje->fecha_asignacion,
                'fecha_salida' => $request->fecha_salida,
                'fecha_entrega' => $request->fecha_entrega,
            ]);

            // Actualizar estado del pedido si cambió
            if ($pedido->estado !== $nuevoEstadoPedido) {
                $pedido->estado = $nuevoEstadoPedido;
                $pedido->save();

                // Crear nota descriptiva del cambio
                $notasHistorial = $this->generarNotaHistorial(
                    $user->name,
                    $estadoViajeAnterior,
                    $estadoViajeNuevo,
                    $viaje->vehiculo_id !== $request->vehiculo_id,
                    $viaje->conductor_id !== $request->conductor_id
                );

                // Registrar en el historial
                PedidoEstadoHistorial::create([
                    'pedido_id' => $pedido->id,
                    'estado_anterior' => $estadoPedidoAnterior,
                    'estado_nuevo' => $nuevoEstadoPedido,
                    'notas' => $notasHistorial,
                ]);
            } else {
                // Si solo cambiaron datos del viaje pero no el estado
                if ($viaje->vehiculo_id !== $request->vehiculo_id || $viaje->conductor_id !== $request->conductor_id) {
                    $notasHistorial = $this->generarNotaHistorial(
                        $user->name,
                        $estadoViajeAnterior,
                        $estadoViajeNuevo,
                        $viaje->vehiculo_id !== $request->vehiculo_id,
                        $viaje->conductor_id !== $request->conductor_id
                    );

                    PedidoEstadoHistorial::create([
                        'pedido_id' => $pedido->id,
                        'estado_anterior' => $estadoPedidoAnterior,
                        'estado_nuevo' => $estadoPedidoAnterior, // Mismo estado
                        'notas' => $notasHistorial,
                    ]);
                }
            }

            DB::commit();

            return redirect()->back()->with('success', 'Asignación de vehículo actualizada correctamente');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error al actualizar asignación: ' . $e->getMessage(), [
                'pedido_id' => $pedido->id,
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->with('error', 'Error al actualizar la asignación: ' . $e->getMessage());
        }
    }

    /**
     * Validar si la transición de estado es permitida
     */
    private function validarTransicionEstado($estadoActual, $estadoNuevo)
    {
        // Definir transiciones válidas
        $transicionesPermitidas = [
            'pendiente' => ['confirmado', 'cancelado'],
            'confirmado' => ['en_preparacion', 'cancelado'],
            'en_preparacion' => ['en_ruta', 'cancelado'],
            'en_ruta' => ['entregado', 'cancelado'],
            'entregado' => [], // Estado final, no se puede cambiar
            'cancelado' => [], // Estado final, no se puede cambiar
        ];

        // Si el estado no cambia, siempre es válido
        if ($estadoActual === $estadoNuevo) {
            return ['valido' => true];
        }

        // Verificar si la transición está permitida
        if (in_array($estadoNuevo, $transicionesPermitidas[$estadoActual] ?? [])) {
            return ['valido' => true];
        }

        // Transición no permitida
        $mensajesEstado = [
            'pendiente' => 'pendiente',
            'confirmado' => 'confirmado',
            'en_preparacion' => 'en preparación',
            'en_ruta' => 'en ruta',
            'entregado' => 'entregado',
            'cancelado' => 'cancelado',
        ];

        return [
            'valido' => false,
            'mensaje' => sprintf(
                'No se puede cambiar el estado de "%s" a "%s". Esta transición no está permitida.',
                $mensajesEstado[$estadoActual] ?? $estadoActual,
                $mensajesEstado[$estadoNuevo] ?? $estadoNuevo
            )
        ];
    }

    /**
     * Generar nota descriptiva para el historial
     */
    private function generarNotaHistorial($nombreUsuario, $estadoViajeAnterior, $estadoViajeNuevo, $cambioVehiculo, $cambioConductor)
    {
        $cambios = [];

        if ($estadoViajeAnterior !== $estadoViajeNuevo) {
            $cambios[] = "estado de '{$estadoViajeAnterior}' a '{$estadoViajeNuevo}'";
        }

        if ($cambioVehiculo) {
            $cambios[] = "vehículo asignado";
        }

        if ($cambioConductor) {
            $cambios[] = "conductor asignado";
        }

        if (empty($cambios)) {
            return "Asignación actualizada por {$nombreUsuario}";
        }

        return "Actualizado por {$nombreUsuario}: " . implode(', ', $cambios);
    }

    /**
     * Completar un pedido
     * Cambia el estado de pendiente/confirmado a entregado
     */
    public function completarPedido(Request $request, Pedido $pedido)
    {
        $user = auth()->user();
        
        // Verificar que el usuario tenga una sucursal asignada
        $sucursal = $user->sucursales()->first();
        if (!$sucursal) {
            return redirect()->back()->with('error', 'Usuario no tiene una sucursal asignada');
        }

        // Verificar que el pedido pertenezca a la sucursal del usuario
        if ($pedido->sucursal_id !== $sucursal->id) {
            return redirect()->back()->with('error', 'No tienes permiso para modificar este pedido');
        }

        // Verificar que el pedido esté en un estado válido para completar
        $estadosValidos = ['pendiente', 'confirmado', 'en_preparacion', 'listo_para_envio'];
        if (!in_array($pedido->estado, $estadosValidos)) {
            return redirect()->back()->with('error', 'El pedido no puede ser completado en su estado actual');
        }

        DB::beginTransaction();
        try {
            // Guardar el estado anterior
            $estadoAnterior = $pedido->estado;
            
            // Cambiar el estado a entregado
            $pedido->estado = 'entregado';
            $pedido->fecha_entrega = now();
            $pedido->monto_adelanto = $pedido->total;
            $pedido->saldo_pendiente = 0;
            $pedido->estado_pago = 'pagado';
            $pedido->fecha_entrega = now();
            $pedido->save();

            // Registrar el cambio de estado en el historial
            PedidoEstadoHistorial::create([
                'pedido_id' => $pedido->id,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo' => 'entregado',
                'notas' => "Pedido completado por {$user->name}",
            ]);

            ViajePedido::where('pedido_id', $pedido->id)
                ->whereIn('estado', ['asignado', 'en_camino'])
                ->update(['estado' => 'entregado']);

            DB::commit();

            return redirect()->back()->with('success', 'Pedido completado correctamente');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->back()->with('error', 'Error al completar el pedido: ' . $e->getMessage());
        }
    }

    /**
     * Cancelar un pedido
     * Cambia el estado a cancelado y guarda el motivo
     */
    public function cancelarPedido(Request $request, Pedido $pedido)
    {
        $validated = $request->validate([
            'motivo_cancelacion' => 'required|string|max:1000',
        ]);

        $user = auth()->user();
        
        // Verificar que el usuario tenga una sucursal asignada
        $sucursal = $user->sucursales()->first();
        if (!$sucursal) {
            return redirect()->back()->with('error', 'Usuario no tiene una sucursal asignada');
        }

        // Verificar que el pedido pertenezca a la sucursal del usuario
        if ($pedido->sucursal_id !== $sucursal->id) {
            return redirect()->back()->with('error', 'No tienes permiso para modificar este pedido');
        }

        // Verificar que el pedido esté en un estado válido para cancelar
        $estadosValidos = ['pendiente', 'confirmado', 'en_preparacion', 'listo_para_envio', 'en_camino'];
        if (!in_array($pedido->estado, $estadosValidos)) {
            return redirect()->back()->with('error', 'El pedido no puede ser cancelado en su estado actual');
        }

        DB::beginTransaction();
        try {
            // Guardar el estado anterior
            $estadoAnterior = $pedido->estado;
            
            // Cambiar el estado a cancelado
            $pedido->estado = 'cancelado';
            $pedido->fecha_cancelacion = now();
            $pedido->motivo_cancelacion = $validated['motivo_cancelacion'];
            $pedido->cancelado_por = $user->id;
            $pedido->save();

            // Registrar el cambio de estado en el historial
            PedidoEstadoHistorial::create([
                'pedido_id' => $pedido->id,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo' => 'cancelado',
                'notas' => "Pedido cancelado por {$user->name}. Motivo: {$validated['motivo_cancelacion']}",
            ]);

            ViajePedido::where('pedido_id', $pedido->id)
                ->whereIn('estado', ['asignado', 'en_camino'])
                ->update(['estado' => 'cancelado']);

            DB::commit();

            return redirect()->back()->with('success', 'Pedido cancelado correctamente');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->back()->with('error', 'Error al cancelar el pedido: ' . $e->getMessage());
        }
    }

    //confirmar pedido recibido por id
    public function confirmarPedido(string|int $pedidoId)
    {
        $user = auth()->user();
        $sucursal = $user->sucursales()->first();
        if (!$sucursal) {
            return redirect()->back()->with('error', 'Usuario no tiene una sucursal asignada');
        }

        $pedido = Pedido::find($pedidoId);
        if (!$pedido) {
            return redirect()->back()->with('error', 'Pedido no encontrado');
        }

        if ($pedido->sucursal_id !== $sucursal->id) {
            return redirect()->back()->with('error', 'No tienes permiso para modificar este pedido');
        }

        // Solo permitir confirmar si está en estado pendiente
        if ($pedido->estado !== 'pendiente') {
            return redirect()->back()->with('error', 'Solo se pueden confirmar pedidos en estado pendiente');
        }

        \DB::beginTransaction();
        try {
            $estadoAnterior = $pedido->estado;
            $pedido->estado = 'confirmado';
            $pedido->save();

            \App\Models\PedidoEstadoHistorial::create([
                'pedido_id' => $pedido->id,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo' => 'confirmado',
                'notas' => "Pedido confirmado por {$user->name}",
            ]);

            \DB::commit();
            return redirect()->back()->with('success', 'Pedido confirmado correctamente');
        } catch (\Exception $e) {
            \DB::rollBack();
            return redirect()->back()->with('error', 'Error al confirmar el pedido: ' . $e->getMessage());
        }
    }

}
