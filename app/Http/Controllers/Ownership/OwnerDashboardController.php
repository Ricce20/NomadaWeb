<?php

namespace App\Http\Controllers\Ownership;

use App\Http\Controllers\Controller;
use App\Models\Negocio;
use App\Models\Pedido;
use App\Models\PedidoDetalle;
use App\Models\Sucursal;
use App\Models\WarehouseProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class OwnerDashboardController extends Controller
{
    /**
     * Display owner dashboard with executive metrics
     */
    public function index(Request $request, $businessId)
    {
        // Verificar que el usuario tenga acceso al negocio
        $negocio = Negocio::findOrFail($businessId);
        
        // Validar que el usuario sea owner o super_admin
        $user = $request->user();
        if (!$user->isOwner() && !$user->isSuperAdmin()) {
            abort(403, 'No tienes permisos para acceder a este dashboard');
        }

        // Parámetros de filtro
        $from = $request->input('from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $to = $request->input('to', Carbon::now()->format('Y-m-d'));
        $branchId = $request->input('branch_id');

        // Cache key basado en parámetros
        $cacheKey = "owner_dashboard_{$businessId}_{$from}_{$to}_{$branchId}";

        $data = Cache::remember($cacheKey, 60, function () use ($negocio, $from, $to, $branchId) {
            return $this->calculateMetrics($negocio, $from, $to, $branchId);
        });

        return Inertia::render('ownership', [
            'negocio' => [
                'id' => $negocio->id,
                'nombre' => $negocio->nombre,
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
     * Calculate all dashboard metrics
     */
    private function calculateMetrics(Negocio $negocio, string $from, string $to, $branchId = null)
    {
        // Obtener IDs de sucursales del negocio
        $branchIds = Sucursal::where('negocio_id', $negocio->id)->pluck('id');

        // Filtrar por sucursal específica si se proporciona
        if ($branchId) {
            $branchIds = $branchIds->filter(fn($id) => $id == $branchId);
        }

        return [
            'kpis' => $this->calculateKPIs($branchIds, $from, $to),
            'orders_by_status' => $this->getOrdersByStatus($branchIds, $from, $to),
            'top_products' => $this->getTopProducts($branchIds, $from, $to),
            'top_branches' => $this->getTopBranches($branchIds, $from, $to),
            'revenue_timeseries' => $this->getRevenueTimeseries($branchIds, $from, $to),
            'recent_orders' => $this->getRecentOrders($branchIds),
        ];
    }

    /**
     * Calculate KPIs
     */
    private function calculateKPIs($branchIds, string $from, string $to)
    {
        $orders = Pedido::whereIn('sucursal_id', $branchIds)
            ->whereBetween('fecha_pedido', [$from, $to])
            ->select('total', 'estado')
            ->get();

        $totalRevenue = $orders->where('estado', 'entregado')->sum('total');
        $totalOrders = $orders->count();
        $avgOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        // Stock total y crítico
        $totalStock = WarehouseProduct::whereHas('warehouse', function ($q) use ($branchIds) {
            $q->whereIn('sucursal_id', $branchIds);
        })->sum('stock');

        // Stock crítico: por ahora 0 ya que no hay columna min_stock en product_base_branch
        // TODO: Agregar lógica de stock crítico cuando se implemente min_stock
        $stockCritical = 0;

        return [
            'total_revenue' => round($totalRevenue, 2),
            'total_orders' => $totalOrders,
            'avg_order_value' => round($avgOrderValue, 2),
            'total_stock' => $totalStock,
            'stock_critical' => $stockCritical,
            'total_branches' => count($branchIds),
        ];
    }

    /**
     * Get orders grouped by status
     */
    private function getOrdersByStatus($branchIds, string $from, string $to)
    {
        $orders = Pedido::whereIn('sucursal_id', $branchIds)
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
     * Get top selling products
     */
    private function getTopProducts($branchIds, string $from, string $to, int $limit = 10)
    {
        return PedidoDetalle::whereHas('pedido', function ($q) use ($branchIds, $from, $to) {
            $q->whereIn('sucursal_id', $branchIds)
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
     * Get top performing branches
     */
    private function getTopBranches($branchIds, string $from, string $to, int $limit = 5)
    {
        return Pedido::whereIn('sucursal_id', $branchIds)
            ->whereBetween('fecha_pedido', [$from, $to])
            ->where('estado', 'entregado')
            ->with('sucursal:id,nombre')
            ->select('sucursal_id', DB::raw('SUM(total) as revenue'), DB::raw('COUNT(*) as orders_count'))
            ->groupBy('sucursal_id')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'branch_id' => $item->sucursal_id,
                    'name' => $item->sucursal?->nombre ?? 'Sucursal eliminada',
                    'revenue' => round($item->revenue, 2),
                    'orders_count' => $item->orders_count,
                ];
            });
    }

    /**
     * Get revenue timeseries for the last 30 days
     */
    private function getRevenueTimeseries($branchIds, string $from, string $to)
    {
        $fromDate = Carbon::parse($from);
        $toDate = Carbon::parse($to);
        
        $orders = Pedido::whereIn('sucursal_id', $branchIds)
            ->whereBetween('fecha_pedido', [$from, $to])
            ->where('estado', 'entregado')
            ->select(DB::raw('DATE(fecha_pedido) as date'), DB::raw('SUM(total) as revenue'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        // Generar serie completa con días faltantes en 0
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
    private function getRecentOrders($branchIds, int $limit = 5)
    {
        return Pedido::whereIn('sucursal_id', $branchIds)
            ->with('sucursal:id,nombre')
            ->select('id', 'folio', 'total', 'estado', 'sucursal_id', 'created_at')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'folio' => $order->folio,
                    'total' => round($order->total, 2),
                    'estado' => $order->estado,
                    'branch_name' => $order->sucursal?->nombre ?? 'N/A',
                    'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                ];
            });
    }
}
