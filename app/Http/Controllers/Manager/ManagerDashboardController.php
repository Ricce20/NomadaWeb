<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Models\PedidoDetalle;
use App\Models\Sucursal;
use App\Models\WarehouseProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class ManagerDashboardController extends Controller
{
    /**
     * Dashboard principal - redirige según el tipo de usuario
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();
        
        // Si es manager, mostrar dashboard con métricas
        if ($user->isAdmin()) {
            return $this->index($request);
        }
        
        // Para otros roles (owner, warehouse_man, driver), mostrar dashboard básico
        $primaryBranch = null;
        
        if (in_array($user->type, ['owner', 'warehouse_man', 'driver'])) {
            if ($user->isOwner()) {
                $negocioId = $user->negocio()->pluck('id')->first();
                if ($negocioId) {
                    $sucursal = Sucursal::where('negocio_id', $negocioId)->first();
                    if ($sucursal) {
                        $primaryBranch = [
                            'id' => $sucursal->id,
                            'nombre' => $sucursal->nombre,
                        ];
                    }
                }
            } else {
                $sucursal = $user->sucursales()->first();
                if ($sucursal) {
                    $primaryBranch = [
                        'id' => $sucursal->id,
                        'nombre' => $sucursal->nombre,
                    ];
                }
            }
        }
        
        return Inertia::render('dashboard', [
            'primaryBranch' => $primaryBranch,
        ]);
    }

    /**
     * Display manager dashboard with branch metrics
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Validar que el usuario sea manager
        if (!$user->isAdmin()) {
            abort(403, 'No tienes permisos para acceder a este dashboard');
        }

        // Obtener sucursales asignadas al manager
        $assignedBranches = $user->sucursales()->get();
        
        if ($assignedBranches->isEmpty()) {
            return Inertia::render('manager/dashboard', [
                'branches' => [],
                'selectedBranch' => null,
                'metrics' => null,
                'filters' => [
                    'from' => Carbon::now()->subDays(30)->format('Y-m-d'),
                    'to' => Carbon::now()->format('Y-m-d'),
                    'branch_id' => null,
                ],
                'error' => 'No tienes sucursales asignadas',
            ]);
        }

        // Parámetros de filtro
        $from = $request->input('from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $to = $request->input('to', Carbon::now()->format('Y-m-d'));
        $branchId = $request->input('branch_id', $assignedBranches->first()->id);

        // Validar que el branch_id sea de una sucursal asignada
        $selectedBranch = $assignedBranches->firstWhere('id', $branchId);
        if (!$selectedBranch) {
            $selectedBranch = $assignedBranches->first();
            $branchId = $selectedBranch->id;
        }

        // Cache key basado en parámetros
        $cacheKey = "manager_dashboard_{$user->id}_{$branchId}_{$from}_{$to}";

        $data = Cache::remember($cacheKey, 60, function () use ($branchId, $from, $to) {
            return $this->calculateMetrics($branchId, $from, $to);
        });

        return Inertia::render('manager/dashboard', [
            'branches' => $assignedBranches->map(fn($b) => [
                'id' => $b->id,
                'nombre' => $b->nombre,
            ]),
            'selectedBranch' => [
                'id' => $selectedBranch->id,
                'nombre' => $selectedBranch->nombre,
            ],
            'metrics' => $data,
            'filters' => [
                'from' => $from,
                'to' => $to,
                'branch_id' => $branchId,
            ],
        ]);
    }

    /**
     * Calculate all dashboard metrics for a specific branch
     */
    private function calculateMetrics(int $branchId, string $from, string $to)
    {
        return [
            'kpis' => $this->calculateKPIs($branchId, $from, $to),
            'orders_by_status' => $this->getOrdersByStatus($branchId, $from, $to),
            'top_products' => $this->getTopProducts($branchId, $from, $to),
            'revenue_timeseries' => $this->getRevenueTimeseries($branchId, $from, $to),
            'recent_orders' => $this->getRecentOrders($branchId),
            'low_stock_products' => $this->getLowStockProducts($branchId),
        ];
    }

    /**
     * Calculate KPIs for a branch
     */
    private function calculateKPIs(int $branchId, string $from, string $to)
    {
        $orders = Pedido::where('sucursal_id', $branchId)
            ->whereBetween('fecha_pedido', [$from, $to])
            ->select('total', 'estado')
            ->get();

        $totalRevenue = $orders->where('estado', 'entregado')->sum('total');
        $totalOrders = $orders->count();
        $deliveredOrders = $orders->where('estado', 'entregado')->count();
        $pendingOrders = $orders->whereIn('estado', ['pendiente', 'confirmado', 'en_preparacion', 'en_ruta'])->count();
        $avgOrderValue = $deliveredOrders > 0 ? $totalRevenue / $deliveredOrders : 0;

        // Stock total en almacenes de la sucursal
        $totalStock = WarehouseProduct::whereHas('warehouse', function ($q) use ($branchId) {
            $q->where('sucursal_id', $branchId);
        })->sum('stock');

        // Productos con stock bajo (menos de 10 unidades)
        $lowStockCount = WarehouseProduct::whereHas('warehouse', function ($q) use ($branchId) {
            $q->where('sucursal_id', $branchId);
        })->where('stock', '<', 10)->where('stock', '>', 0)->count();

        return [
            'total_revenue' => round($totalRevenue, 2),
            'total_orders' => $totalOrders,
            'delivered_orders' => $deliveredOrders,
            'pending_orders' => $pendingOrders,
            'avg_order_value' => round($avgOrderValue, 2),
            'total_stock' => $totalStock,
            'low_stock_count' => $lowStockCount,
        ];
    }

    /**
     * Get orders grouped by status
     */
    private function getOrdersByStatus(int $branchId, string $from, string $to)
    {
        $orders = Pedido::where('sucursal_id', $branchId)
            ->whereBetween('fecha_pedido', [$from, $to])
            ->select('estado', DB::raw('count(*) as count'))
            ->groupBy('estado')
            ->get()
            ->pluck('count', 'estado');

        return [
            'pendiente' => $orders->get('pendiente', 0),
            'confirmado' => $orders->get('confirmado', 0),
            'en_preparacion' => $orders->get('en_preparacion', 0),
            'en_ruta' => $orders->get('en_ruta', 0),
            'entregado' => $orders->get('entregado', 0),
            'cancelado' => $orders->get('cancelado', 0),
        ];
    }

    /**
     * Get top selling products for the branch
     */
    private function getTopProducts(int $branchId, string $from, string $to, int $limit = 10)
    {
        return PedidoDetalle::whereHas('pedido', function ($q) use ($branchId, $from, $to) {
            $q->where('sucursal_id', $branchId)
                ->whereBetween('fecha_pedido', [$from, $to])
                ->where('estado', 'entregado');
        })
        ->with('productBaseBranch.productBase')
        ->select('product_base_branch_id', DB::raw('SUM(cantidad) as qty_sold'), DB::raw('SUM(subtotal) as revenue'))
        ->groupBy('product_base_branch_id')
        ->orderByDesc('qty_sold')
        ->limit($limit)
        ->get()
        ->map(function ($item) {
            return [
                'product_id' => $item->product_base_branch_id,
                'name' => $item->productBaseBranch?->productBase?->name ?? 'Producto eliminado',
                'qty_sold' => (int) $item->qty_sold,
                'revenue' => round($item->revenue, 2),
            ];
        });
    }

    /**
     * Get revenue timeseries
     */
    private function getRevenueTimeseries(int $branchId, string $from, string $to)
    {
        $fromDate = Carbon::parse($from);
        $toDate = Carbon::parse($to);
        
        $orders = Pedido::where('sucursal_id', $branchId)
            ->whereBetween('fecha_pedido', [$from, $to])
            ->where('estado', 'entregado')
            ->select(DB::raw('DATE(fecha_pedido) as date'), DB::raw('SUM(total) as revenue'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $timeseries = [];
        $currentDate = $fromDate->copy();
        
        while ($currentDate->lte($toDate)) {
            $dateStr = $currentDate->format('Y-m-d');
            $timeseries[] = [
                'date' => $dateStr,
                'revenue' => isset($orders[$dateStr]) ? round($orders[$dateStr]->revenue, 2) : 0,
            ];
            $currentDate->addDay();
        }

        return $timeseries;
    }

    /**
     * Get recent orders
     */
    private function getRecentOrders(int $branchId, int $limit = 10)
    {
        return Pedido::where('sucursal_id', $branchId)
            ->with('cliente:id,nombre')
            ->select('id', 'folio', 'total', 'estado', 'cliente_id', 'created_at')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'folio' => $order->folio,
                    'total' => round($order->total, 2),
                    'estado' => $order->estado,
                    'cliente_name' => $order->cliente?->nombre ?? 'Cliente eliminado',
                    'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                ];
            });
    }

    /**
     * Get products with low stock
     */
    private function getLowStockProducts(int $branchId, int $limit = 5)
    {
        return WarehouseProduct::whereHas('warehouse', function ($q) use ($branchId) {
            $q->where('sucursal_id', $branchId);
        })
        ->with(['productBase:id,name', 'warehouse:id,nombre'])
        ->where('stock', '<', 10)
        ->where('stock', '>', 0)
        ->orderBy('stock')
        ->limit($limit)
        ->get()
        ->map(function ($item) {
            return [
                'product_id' => $item->product_base_id,
                'name' => $item->productBase?->name ?? 'Producto eliminado',
                'warehouse' => $item->warehouse?->nombre ?? 'Almacén eliminado',
                'stock' => $item->stock,
            ];
        });
    }
}
