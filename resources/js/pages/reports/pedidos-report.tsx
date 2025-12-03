import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import AppLayoutOwner from '@/layouts/app-layout-ownership';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FileText, Download, Calendar, Filter } from 'lucide-react';
import { FormEvent } from 'react';
import { SharedData } from '@/types';

interface Sucursal {
    id: number;
    nombre: string;
}

interface Props {
    sucursales: Sucursal[];
}

export default function PedidosReport({ sucursales }: Props) {
    const { auth } = usePage<SharedData>().props;
    const isOwner = auth.user.type === 'owner';
    const Layout = isOwner ? AppLayoutOwner : AppLayout;
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, setData, processing } = useForm({
        sucursal_id: '',
        fecha_inicio: thirtyDaysAgo,
        fecha_fin: today,
        estado: 'todos',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        // Construir URL con parámetros
        const params = new URLSearchParams({
            sucursal_id: data.sucursal_id,
            fecha_inicio: data.fecha_inicio,
            fecha_fin: data.fecha_fin,
            ...(data.estado && data.estado !== 'todos' && { estado: data.estado }),
        });

        // Abrir PDF en nueva pestaña
        window.open(`/reportes/pedidos/pdf?${params.toString()}`, '_blank');
    };

    const estados = [
        { value: 'todos', label: 'Todos los estados' },
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'confirmado', label: 'Confirmado' },
        { value: 'en_preparacion', label: 'En Preparación' },
        { value: 'en_ruta', label: 'En Ruta' },
        { value: 'entregado', label: 'Entregado' },
        { value: 'cancelado', label: 'Cancelado' },
    ];

    return (
        <Layout>
            <Head title="Reportes de Pedidos" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Reportes de Pedidos</h1>
                        <p className="text-sm text-muted-foreground">
                            Genera reportes en PDF de los pedidos de tu sucursal
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Formulario */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Configurar Reporte
                            </CardTitle>
                            <CardDescription>
                                Selecciona los filtros para generar tu reporte
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sucursal">Sucursal *</Label>
                                    <Select
                                        value={data.sucursal_id}
                                        onValueChange={(value) => setData('sucursal_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona una sucursal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sucursales.map((sucursal) => (
                                                <SelectItem key={sucursal.id} value={sucursal.id.toString()}>
                                                    {sucursal.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fecha_inicio">Fecha Inicio *</Label>
                                        <Input
                                            id="fecha_inicio"
                                            type="date"
                                            value={data.fecha_inicio}
                                            onChange={(e) => setData('fecha_inicio', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fecha_fin">Fecha Fin *</Label>
                                        <Input
                                            id="fecha_fin"
                                            type="date"
                                            value={data.fecha_fin}
                                            onChange={(e) => setData('fecha_fin', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="estado">Estado</Label>
                                    <Select
                                        value={data.estado}
                                        onValueChange={(value) => setData('estado', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos los estados" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {estados.map((estado) => (
                                                <SelectItem key={estado.value} value={estado.value}>
                                                    {estado.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={!data.sucursal_id || processing}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Generar Reporte PDF
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Información del Reporte
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg bg-muted p-4">
                                <h4 className="font-semibold mb-2">El reporte incluye:</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>• Lista de pedidos con folio, fecha, cliente y total</li>
                                    <li>• Resumen de pedidos por estado</li>
                                    <li>• Total de ingresos (pedidos entregados)</li>
                                    <li>• Información del negocio y sucursal</li>
                                </ul>
                            </div>

                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                                <h4 className="font-semibold text-primary mb-2">Consejo</h4>
                                <p className="text-sm text-muted-foreground">
                                    Para un reporte más específico, utiliza los filtros de fecha y estado. 
                                    Puedes generar reportes diarios, semanales o mensuales.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
