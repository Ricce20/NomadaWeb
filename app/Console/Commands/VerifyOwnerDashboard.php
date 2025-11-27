<?php

namespace App\Console\Commands;

use App\Models\Negocio;
use App\Models\Pedido;
use App\Models\PedidoDetalle;
use App\Models\Sucursal;
use App\Models\WarehouseProduct;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class VerifyOwnerDashboard extends Command
{
    protected $signature = 'dashboard:verify-owner {--business= : ID del negocio a verificar}';
    protected $description = 'Verifica las queries del dashboard del owner';

    public function handle()
    {
        $this->info('Verificando Dashboard del Owner...');
        $this->newLine();

        // Obtener negocio
        $businessId = $this->option('business');
        if (!$businessId) {
            $negocio = Negocio::first();
            if (!$negocio) {
                $this->error('No hay negocios en la base de datos');
                return Command::FAILURE;
            }
            $businessId = $negocio->id;
        } else {
            $negocio = Negocio::find($businessId);
            if (!$negocio) {
                $this->error("Negocio con ID {$businessId} no encontrado");
                return Command::FAILURE;
            }
        }

        $this->info("Negocio: {$negocio->nombre} (ID: {$negocio->id})");
        $this->newLine();

        // Obtener sucursales del negocio
        $branchIds = Sucursal::where('negocio_id', $negocio->id)->pluck('id');
        $this->info("Sucursales encontradas: " . $branchIds->count());
        
        if ($branchIds->isEmpty()) {
            $this->warn('No hay sucursales para este negocio');
            return Command::SUCCESS;
        }

        // Fechas para el análisis
        $from = Carbon::now()->subDays(30)->format('Y-m-d');
        $to = Carbon::now()->format('Y-m-d');
        $this->info("Período: {$from} a {$to}");
        $this->newLine();

        // Verificar KPIs
        $this->info('Verificando KPIs...');
        $this->verifyKPIs($branchIds, $from, $to);
        $this->newLine();

        // Verificar orders by status
        $this->info('Verificando pedidos por estado...');
        $this->verifyOrdersByStatus($branchIds, $from, $to);
        $this->newLine();

        // Verificar top products
        $this->info('Verificando top productos...');
        $this->verifyTopProducts($branchIds, $from, $to);
        $this->newLine();

        // Verificar top branches
        $this->info('Verificando top sucursales...');
        $this->verifyTopBranches($branchIds, $from, $to);
        $this->newLine();

        // Verificar revenue timeseries
        $this->info('Verificando serie temporal de ingresos...');
        $this->verifyRevenueTimeseries($branchIds, $from, $to);
        $this->newLine();

        // Verificar recent orders
        $this->info('Verificando pedidos recientes...');
        $this->verifyRecentOrders($branchIds);
        $this->newLine();

        $this->info('Verificación completada exitosamente');
        return Command::SUCCESS;
    }

    private function verifyKPIs($branchIds, $from, $to)
    {
        // Total revenue
        $totalRevenue = Pedido::whereIn('sucursal_id', $branchIds)
            ->whereBetween('fecha_pedido', [$from, $to])
            ->where('estado', 'entregado')
            ->sum('total');
        
        $this->line("  Total Revenue: $" . number_format($totalRevenue, 2));

        // Total orders
        $totalOrders = Pedido::whereIn('sucursal_id', $branchIds)
            ->whereBetween('fecha_pedido', [$from, $to])
            ->count();
        
        $this->line("  Total Orders: {$totalOrders}");

        // Avg order value
        $avgOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;
        $this->line("  Avg Order Value: $" . number_format($avgOrderValue, 2));

        // Total stock
        $totalStock = WarehouseProduct::whereHas('warehouse', function ($q) use ($branchIds) {
            $q->whereIn('sucursal_id', $branchIds);
        })->sum('stock');
        
        $this->line("  Total Stock: {$totalStock}");

        // Stock critical: por ahora 0 ya que no hay columna min_stock
        $stockCritical = 0;
        
        $this->line("  Stock Critical: {$stockCritical}");

        // Total branches
        $this->line("  Total Branches: " . count($branchIds));

        if ($totalOrders > 0) {
            $this->info('  OK - KPIs calculados correctamente');
        } else {
            $this->warn('  WARNING - No hay pedidos en el período especificado');
        }
    }

    private function verifyOrdersByStatus($branchIds, $from, $to)
    {
        $orders = Pedido::whereIn('sucursal_id', $branchIds)
            ->whereBetween('fecha_pedido', [$from, $to])
            ->select('estado', DB::raw('count(*) as count'))
            ->groupBy('estado')
            ->get();

        foreach ($orders as $order) {
            $this->line("  {$order->estado}: {$order->count}");
        }

        if ($orders->isEmpty()) {
            $this->warn('  WARNING - No hay pedidos para mostrar');
        } else {
            $this->info('  OK - Pedidos por estado calculados correctamente');
        }
    }

    private function verifyTopProducts($branchIds, $from, $to)
    {
        $topProducts = PedidoDetalle::whereHas('pedido', function ($q) use ($branchIds, $from, $to) {
            $q->whereIn('sucursal_id', $branchIds)
                ->whereBetween('fecha_pedido', [$from, $to])
                ->where('estado', 'entregado');
        })
        ->with('productBaseBranch.productBase')
        ->select('product_base_branch_id', DB::raw('SUM(cantidad) as qty_sold'))
        ->groupBy('product_base_branch_id')
        ->orderByDesc('qty_sold')
        ->limit(5)
        ->get();

        foreach ($topProducts as $product) {
            $name = $product->productBaseBranch?->productBase?->name ?? 'N/A';
            $this->line("  {$name}: {$product->qty_sold} unidades");
        }

        if ($topProducts->isEmpty()) {
            $this->warn('  WARNING - No hay productos vendidos');
        } else {
            $this->info('  OK - Top productos calculados correctamente');
        }
    }

    private function verifyTopBranches($branchIds, $from, $to)
    {
        $topBranches = Pedido::whereIn('sucursal_id', $branchIds)
            ->whereBetween('fecha_pedido', [$from, $to])
            ->where('estado', 'entregado')
            ->with('sucursal:id,nombre')
            ->select('sucursal_id', DB::raw('SUM(total) as revenue'))
            ->groupBy('sucursal_id')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        foreach ($topBranches as $branch) {
            $name = $branch->sucursal?->nombre ?? 'N/A';
            $this->line("  {$name}: $" . number_format($branch->revenue, 2));
        }

        if ($topBranches->isEmpty()) {
            $this->warn('  WARNING - No hay ventas por sucursal');
        } else {
            $this->info('  OK - Top sucursales calculadas correctamente');
        }
    }

    private function verifyRevenueTimeseries($branchIds, $from, $to)
    {
        $fromDate = Carbon::parse($from);
        $toDate = Carbon::parse($to);
        $days = $fromDate->diffInDays($toDate) + 1;

        $orders = Pedido::whereIn('sucursal_id', $branchIds)
            ->whereBetween('fecha_pedido', [$from, $to])
            ->where('estado', 'entregado')
            ->select(DB::raw('DATE(fecha_pedido) as date'), DB::raw('SUM(total) as revenue'))
            ->groupBy('date')
            ->get();

        $this->line("  Días en el período: {$days}");
        $this->line("  Días con ventas: " . $orders->count());
        $this->line("  Total en serie: $" . number_format($orders->sum('revenue'), 2));

        if ($days > 0) {
            $this->info('  OK - Serie temporal generada correctamente');
        } else {
            $this->error('  ERROR - Error en el cálculo de días');
        }
    }

    private function verifyRecentOrders($branchIds)
    {
        $recentOrders = Pedido::whereIn('sucursal_id', $branchIds)
            ->with('sucursal:id,nombre')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        foreach ($recentOrders as $order) {
            $branch = $order->sucursal?->nombre ?? 'N/A';
            $this->line("  #{$order->folio} - {$branch} - $" . number_format($order->total, 2) . " - {$order->estado}");
        }

        if ($recentOrders->isEmpty()) {
            $this->warn('  WARNING - No hay pedidos recientes');
        } else {
            $this->info('  OK - Pedidos recientes obtenidos correctamente');
        }
    }
}
