import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowRight, Package, PackageSearch } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardProps {
    primaryBranch?: {
        id: number;
        nombre: string;
    } | null;
}

export default function Dashboard() {
    const { auth, primaryBranch } = usePage<DashboardProps & { auth: { user: any } }>().props;
    const user = auth.user;
    
    // Verificar si el usuario es owner o warehouse_man
    const showBranchOperations = user && (user.type === 'owner' || user.type === 'warehouse_man');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Sección de operaciones de sucursal para owner y warehouse_man */}
                {showBranchOperations && (
                    <div className="space-y-4">
                        {primaryBranch ? (
                            <>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight">
                                        Operaciones de Sucursal
                                    </h2>
                                    <p className="text-muted-foreground">
                                        {primaryBranch.nombre}
                                    </p>
                                </div>
                                
                                <div className="grid gap-4 md:grid-cols-2">
                                    {/* Tarjeta: Gestión de Almacenes */}
                                    <Card className="hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 rounded-lg bg-primary/10">
                                                    <PackageSearch className="h-5 w-5 text-primary" />
                                                </div>
                                                <CardTitle>Gestión de Almacenes</CardTitle>
                                            </div>
                                            <CardDescription>
                                                Consulta el inventario de los almacenes de tu sucursal
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Button asChild className="w-full">
                                                <Link href="/sucursal/gestion/almacenes">
                                                    Ver Almacenes
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    {/* Tarjeta: Movimientos de inventario */}
                                    <Card className="hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 rounded-lg bg-primary/10">
                                                    <Package className="h-5 w-5 text-primary" />
                                                </div>
                                                <CardTitle>Movimientos de Inventario</CardTitle>
                                            </div>
                                            <CardDescription>
                                                Registra entradas y ajustes de stock en los almacenes
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Button asChild className="w-full">
                                                <Link href="/sucursal/inventario/movimientos">
                                                    Ver Movimientos
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </>
                        ) : (
                            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                        <CardTitle className="text-yellow-900 dark:text-yellow-100">
                                            Sin Sucursal Asignada
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-yellow-700 dark:text-yellow-300">
                                        No tienes una sucursal asignada. Contacta al administrador para que te asigne a una sucursal.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        )}
                    </div>
                )}

                {/* Placeholders originales para otros roles */}
                {!showBranchOperations && (
                    <>
                        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                            <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                            </div>
                            <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                            </div>
                            <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                            </div>
                        </div>
                        <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
