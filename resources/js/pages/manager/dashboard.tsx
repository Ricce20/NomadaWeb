import { KpiCard } from '@/components/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { 
    DollarSign, 
    ShoppingCart, 
    TrendingUp, 
    Package, 
    AlertTriangle, 
    Clock,
    CheckCircle
} from 'lucide-react';
import { LineChart } from '@/components/charts/line-chart';
import { DoughnutChart } from '@/components/charts/doughnut-chart';
import { BarChart } from '@/components/charts/bar-chart';

interface DashboardMetrics {
    kpis: {
        total_revenue: number;
        total_orders: number;
        delivered_orders: number;
        pending_orders: number;
        avg_order_value: number;
        total_stock: number;
        low_stock_count: number;
    };
    orders_by_status: {
        pendiente: number;
        confirmado: number;
        en_preparacion: number;
        en_ruta: number;
        entregado: number;
        cancelado: number;
    };
    top_products: Array<{
        product_id: number;
        name: string;
        qty_sold: number;
        revenue: number;
    }>;
    revenue_timeseries: Array<{
        date: string;
        revenue: number;
    }>;
    recent_orders: Array<{
        id: number;
        folio: string;
        total: number;
        estado: string;
        cliente_name: string;
        created_at: string;
    }>;
    low_stock_products: Array<{
        product_id: number;
        name: string;
        warehouse: string;
        stock: number;
    }>;
}

interface Branch {
    id: number;
    nombre: string;
}

interface DashboardProps {
    branches: Branch[];
    selectedBranch: Branch | null;
    metrics: DashboardMetrics | null;
    filters: {
        from: string;
        to: string;
        branch_id: number | null;
    };
    error?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
        case 'entregado':
            return 'default';
        case 'en_ruta':
            return 'secondary';
        case 'en_preparacion':
            return 'secondary';
        case 'confirmado':
            return 'secondary';
        case 'pendiente':
            return 'outline';
        case 'cancelado':
            return 'destructive';
        default:
            return 'outline';
    }
};

export default function ManagerDashboard({ branches, selectedBranch, metrics, filters, error }: DashboardProps) {
    const handleBranchChange = (branchId: string) => {
        router.get(dashboard().url, {
            branch_id: branchId,
            from: filters.from,
            to: filters.to,
        }, { preserveState: true });
    };

    if (error || !metrics || !selectedBranch) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard Manager" />
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Sin sucursales asignadas</h2>
                        <p className="text-muted-foreground">
                            {error || 'Contacta al administrador para que te asigne una sucursal.'}
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const { kpis, orders_by_status, top_products, recent_orders, revenue_timeseries, low_stock_products } = metrics;

    // Preparar datos para gráfico de ingresos
    const revenueLabels = revenue_timeseries.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
    });
    const revenueData = revenue_timeseries.map(item => item.revenue);

    // Preparar datos para gráfico de pedidos por estado
    const statusLabels = ['Pendientes', 'Confirmados', 'En Preparación', 'En Ruta', 'Entregados', 'Cancelados'];
    const statusData = [
        orders_by_status.pendiente,
        orders_by_status.confirmado,
        orders_by_status.en_preparacion,
        orders_by_status.en_ruta,
        orders_by_status.entregado,
        orders_by_status.cancelado,
    ];
    const statusColors = [
        'rgb(156, 163, 175)',
        'rgb(59, 130, 246)',
        'rgb(245, 158, 11)',
        'rgb(139, 92, 246)',
        'rgb(16, 185, 129)',
        'rgb(239, 68, 68)',
    ];

    // Preparar datos para gráfico de top productos
    const topProductsLabels = top_products.slice(0, 5).map(p => p.name);
    const topProductsData = top_products.slice(0, 5).map(p => p.qty_sold);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Dashboard - ${selectedBranch.nombre}`} />
            
            <div className="space-y-6 p-6">
                {/* Header con selector de sucursal */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Sucursal</h1>
                        <p className="text-muted-foreground">
                            Gestión y métricas de {selectedBranch.nombre}
                        </p>
                    </div>
                    
                    {branches.length > 1 && (
                        <Select value={String(selectedBranch.id)} onValueChange={handleBranchChange}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Seleccionar sucursal" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map((branch) => (
                                    <SelectItem key={branch.id} value={String(branch.id)}>
                                        {branch.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* KPIs */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <KpiCard
                        title="Ingresos del Período"
                        value={`$${kpis.total_revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                        icon={DollarSign}
                        description="Pedidos entregados"
                    />
                    <KpiCard
                        title="Pedidos Totales"
                        value={kpis.total_orders}
                        icon={ShoppingCart}
                        description="En el período"
                    />
                    <KpiCard
                        title="Pedidos Pendientes"
                        value={kpis.pending_orders}
                        icon={Clock}
                        description="Por procesar"
                    />
                    <KpiCard
                        title="Pedidos Entregados"
                        value={kpis.delivered_orders}
                        icon={CheckCircle}
                        description="Completados"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <KpiCard
                        title="Ticket Promedio"
                        value={`$${kpis.avg_order_value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                        icon={TrendingUp}
                        description="Por pedido entregado"
                    />
                    <KpiCard
                        title="Stock Total"
                        value={kpis.total_stock.toLocaleString()}
                        icon={Package}
                        description="Unidades en almacén"
                    />
                    <KpiCard
                        title="Stock Bajo"
                        value={kpis.low_stock_count}
                        icon={AlertTriangle}
                        description="Productos < 10 unidades"
                    />
                </div>

                {/* Revenue Timeseries Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ingresos en el Tiempo</CardTitle>
                        <CardDescription>Evolución de ventas en el período</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {revenueData.length > 0 ? (
                                <LineChart
                                    labels={revenueLabels}
                                    data={revenueData}
                                    label="Ingresos"
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay datos de ingresos
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Orders by Status Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pedidos por Estado</CardTitle>
                            <CardDescription>Distribución actual</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                {statusData.some(val => val > 0) ? (
                                    <DoughnutChart
                                        labels={statusLabels}
                                        data={statusData}
                                        colors={statusColors}
                                    />
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No hay pedidos en el período
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Products Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top 5 Productos</CardTitle>
                            <CardDescription>Más vendidos por cantidad</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                {topProductsData.length > 0 ? (
                                    <BarChart
                                        labels={topProductsLabels}
                                        data={topProductsData}
                                        label="Unidades vendidas"
                                    />
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No hay datos de productos
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Low Stock Products */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                Productos con Stock Bajo
                            </CardTitle>
                            <CardDescription>Menos de 10 unidades</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {low_stock_products.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Almacén</TableHead>
                                            <TableHead className="text-right">Stock</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {low_stock_products.map((product) => (
                                            <TableRow key={`${product.product_id}-${product.warehouse}`}>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell>{product.warehouse}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant={product.stock < 5 ? 'destructive' : 'outline'}>
                                                        {product.stock}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay productos con stock bajo
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Products Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Productos Más Vendidos</CardTitle>
                            <CardDescription>Top 10 por cantidad</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {top_products.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Producto</TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead className="text-right">Ingresos</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {top_products.map((product) => (
                                            <TableRow key={product.product_id}>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell className="text-right">{product.qty_sold}</TableCell>
                                                <TableCell className="text-right">
                                                    ${product.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay datos de productos vendidos
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Orders */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pedidos Recientes</CardTitle>
                        <CardDescription>Últimos 10 pedidos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recent_orders.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Folio</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Fecha</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recent_orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono font-medium">
                                                #{order.folio}
                                            </TableCell>
                                            <TableCell>{order.cliente_name}</TableCell>
                                            <TableCell className="text-right">
                                                ${order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getEstadoBadgeVariant(order.estado)}>
                                                    {order.estado}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(order.created_at).toLocaleDateString('es-MX')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No hay pedidos recientes
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
