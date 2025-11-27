import { KpiCard } from '@/components/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayoutOwner from '@/layouts/app-layout-ownership';
import { ownership } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { 
    DollarSign, 
    ShoppingCart, 
    TrendingUp, 
    Package, 
    AlertTriangle, 
    Building2,
    ArrowRight,
    ExternalLink
} from 'lucide-react';

interface DashboardMetrics {
    kpis: {
        total_revenue: number;
        total_orders: number;
        avg_order_value: number;
        total_stock: number;
        stock_critical: number;
        total_branches: number;
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
    top_branches: Array<{
        branch_id: number;
        name: string;
        revenue: number;
        orders_count: number;
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
        branch_name: string;
        created_at: string;
    }>;
}

interface DashboardProps {
    negocio: {
        id: number;
        nombre: string;
    };
    metrics: DashboardMetrics;
    filters: {
        from: string;
        to: string;
        branch_id?: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: ownership().url,
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

export default function OwnerDashboard({ negocio, metrics, filters }: DashboardProps) {
    const { kpis, orders_by_status, top_products, top_branches, recent_orders } = metrics;

    return (
        <AppLayoutOwner breadcrumbs={breadcrumbs}>
            <Head title={`Dashboard - ${negocio.nombre}`} />
            
            <div className="space-y-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Ejecutivo</h1>
                    <p className="text-muted-foreground">
                        Resumen de operaciones de {negocio.nombre}
                    </p>
                </div>

                {/* KPIs */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <KpiCard
                        title="Ingresos Totales"
                        value={`$${kpis.total_revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                        icon={DollarSign}
                        description="Últimos 30 días"
                    />
                    <KpiCard
                        title="Total de Pedidos"
                        value={kpis.total_orders}
                        icon={ShoppingCart}
                        description="Últimos 30 días"
                    />
                    <KpiCard
                        title="Ticket Promedio"
                        value={`$${kpis.avg_order_value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                        icon={TrendingUp}
                        description="Por pedido"
                    />
                    <KpiCard
                        title="Stock Total"
                        value={kpis.total_stock.toLocaleString()}
                        icon={Package}
                        description="En todos los almacenes"
                    />
                    <KpiCard
                        title="Stock Crítico"
                        value={kpis.stock_critical}
                        icon={AlertTriangle}
                        description="Productos bajo mínimo"
                    />
                    <KpiCard
                        title="Sucursales"
                        value={kpis.total_branches}
                        icon={Building2}
                        description="Activas"
                    />
                </div>

                {/* Orders by Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pedidos por Estado</CardTitle>
                        <CardDescription>Distribución de pedidos en el período</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div className="text-center p-4 rounded-lg border">
                                <div className="text-2xl font-bold">{orders_by_status.pendiente}</div>
                                <div className="text-sm text-muted-foreground">Pendientes</div>
                            </div>
                            <div className="text-center p-4 rounded-lg border">
                                <div className="text-2xl font-bold">{orders_by_status.confirmado}</div>
                                <div className="text-sm text-muted-foreground">Confirmados</div>
                            </div>
                            <div className="text-center p-4 rounded-lg border">
                                <div className="text-2xl font-bold">{orders_by_status.en_preparacion}</div>
                                <div className="text-sm text-muted-foreground">En Preparación</div>
                            </div>
                            <div className="text-center p-4 rounded-lg border">
                                <div className="text-2xl font-bold">{orders_by_status.en_ruta}</div>
                                <div className="text-sm text-muted-foreground">En Ruta</div>
                            </div>
                            <div className="text-center p-4 rounded-lg border">
                                <div className="text-2xl font-bold text-green-600">{orders_by_status.entregado}</div>
                                <div className="text-sm text-muted-foreground">Entregados</div>
                            </div>
                            <div className="text-center p-4 rounded-lg border">
                                <div className="text-2xl font-bold text-red-600">{orders_by_status.cancelado}</div>
                                <div className="text-sm text-muted-foreground">Cancelados</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Top Products */}
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

                    {/* Top Branches */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Sucursales Top</CardTitle>
                            <CardDescription>Por ingresos generados</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {top_branches.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Sucursal</TableHead>
                                            <TableHead className="text-right">Pedidos</TableHead>
                                            <TableHead className="text-right">Ingresos</TableHead>
                                            <TableHead className="text-right">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {top_branches.map((branch) => (
                                            <TableRow key={branch.branch_id}>
                                                <TableCell className="font-medium">{branch.name}</TableCell>
                                                <TableCell className="text-right">{branch.orders_count}</TableCell>
                                                <TableCell className="text-right">
                                                    ${branch.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/sucursales/${branch.branch_id}`}>
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay datos de sucursales
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Orders */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Pedidos Recientes</CardTitle>
                            <CardDescription>Últimos 5 pedidos registrados</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recent_orders.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Folio</TableHead>
                                        <TableHead>Sucursal</TableHead>
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
                                            <TableCell>{order.branch_name}</TableCell>
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
        </AppLayoutOwner>
    );
}
