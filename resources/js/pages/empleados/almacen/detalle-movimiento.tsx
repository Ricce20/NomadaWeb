import HeadingSmall from "@/components/heading-small";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";
import inventario from "@/routes/sucursal/inventario";
import { BreadcrumbItem, SucursalItem } from "@/types";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, RefreshCw, Package, User, Calendar, Warehouse, CheckCircle, XCircle, RotateCcw, AlertCircle } from "lucide-react";
import { FormEvent, useState } from "react";

interface MovementDetail {
  id: number;
  product_name: string;
  sku: string;
  unidad_medida: string;
  marca: string | null;
  categoria: string | null;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  notes: string | null;
  diferencia_stock: number;
  stock_actual: number;

}

interface Movement {
  id: number;
  movement_number: string;
  type: string;
  status: string;
  reason: string | null;
  total_quantity: number;
  created_at: string;
  warehouse: {
    id: number;
    nombre: string;
  };
  created_by: {
    name: string;
  };
  approved_by: {
    name: string;
  } | null;
  details: MovementDetail[];
}

interface ShowProps {
  sucursal: SucursalItem;
  movimiento: Movement;
}

export default function VerMovimientoInventario({ sucursal, movimiento }: ShowProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Movimientos de Inventario",
      href: `/sucursal/inventario/movimientos`,
    },
    {
      title: `Movimiento ${movimiento.movement_number}`,
      href: `/sucursal/inventario/movimientos/${movimiento.id}`,
    },
  ];

  const [isProcessing, setIsProcessing] = useState(false);

  const hasInsufficientStock = () => {
    return movimiento.details.some(detail => detail.stock_actual < detail.quantity);
  };

  const getInsufficientStockDetails = () => {
    return movimiento.details.filter(detail => detail.stock_actual < detail.quantity);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowDownCircle className="h-5 w-5" />;
      case 'adjust':
        return <RefreshCw className="h-5 w-5" />;
      case 'out':
        return <ArrowUpCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'in':
        return 'Entrada';
      case 'adjust':
        return 'Ajuste';
      case 'out':
        return 'Salida';
      default:
        return type;
    }
  };

  const getTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" => {
    switch (type) {
      case 'in':
        return 'default';
      case 'adjust':
        return 'secondary';
      case 'out':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'completado':
        return 'default';
      case 'cancelado':
        return 'destructive';
      case 'pendiente':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const { post,processing,errors,clearErrors} = useForm();

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-MX').format(num);
  };

  const handleCompleteMovement = async (e:FormEvent) => {
    e.preventDefault();
    if (!confirm('¿Estás seguro de que deseas completar este movimiento? Esta acción aplicará los cambios de stock.')) {
      return;
    }

    setIsProcessing(processing);
    post(inventario.completarMovimientoEmpleado(movimiento.id).url, {
        
        onSuccess: (e) => {
            console.log(e);
            
            clearErrors();
        },
        onError: (e) => {
            console.log(e);
            
            setIsProcessing(false);
        },
      onFinish: () => setIsProcessing(processing),
    });
  };

  const handleCancelMovement = async (e:FormEvent) => {
    e.preventDefault();
    if (!confirm('¿Estás seguro de que deseas cancelar este movimiento?')) {
      return;
    }

    post(inventario.cancelarMovimientoEmpleado(movimiento.id).url, {
        onSuccess: (e) => {
            console.log(e);
            
            clearErrors();
        },
        onError: (e) => {
            console.log(e);
            
            setIsProcessing(false);
        },
      onFinish: () => setIsProcessing(processing),
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Movimiento ${movimiento.movement_number} - ${sucursal.nombre}`} />
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <HeadingSmall
            title={`Movimiento ${movimiento.movement_number}`}
            description={`Detalles del movimiento de inventario en ${movimiento.warehouse.nombre}`}
          />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/sucursal/inventario/movimientos`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al listado
            </Link>
          </Button>
        </div>

        {/* Banner de stock insuficiente */}
        {hasInsufficientStock() && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Stock insuficiente</h3>
              <p className="text-sm text-red-800 mt-1">
                Los siguientes productos no tienen suficiente stock para completar este movimiento:
              </p>
              <ul className="mt-2 space-y-1">
                {getInsufficientStockDetails().map((detail) => (
                  <li key={detail.id} className="text-sm text-red-800">
                    • <span className="font-medium">{detail.product_name}</span> (SKU: {detail.sku}) - 
                    Requiere: {formatNumber(detail.quantity)}, Disponible: {formatNumber(detail.stock_actual)}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-red-800 mt-2">
                Solo podrás cancelar este movimiento.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tarjetas de información */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tipo</CardTitle>
                  {getTypeIcon(movimiento.type)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <Badge variant={getTypeBadgeVariant(movimiento.type)}>
                      {getTypeLabel(movimiento.type)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estado</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <Badge variant={getStatusBadgeVariant(movimiento.status)}>
                      {movimiento.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Productos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{movimiento.details.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(movimiento.total_quantity)} unidades
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fecha</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">{movimiento.created_at}</div>
                </CardContent>
              </Card>
            </div>

            {/* Detalles de productos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos del movimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Stock Anterior</TableHead>
                      <TableHead className="text-right">Stock Actual</TableHead>
                      <TableHead className="text-right">Stock Nuevo</TableHead>
                      <TableHead className="text-right">Diferencia</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimiento.details.map((detail) => (
                      <TableRow key={detail.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{detail.product_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {detail.marca && `Marca: ${detail.marca} | `}
                              {detail.categoria && `Categoría: ${detail.categoria}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{detail.sku}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatNumber(detail.quantity)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {formatNumber(detail.previous_stock)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {formatNumber(detail.stock_actual)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatNumber(detail.new_stock)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-mono font-semibold ${
                            detail.diferencia_stock > 0 
                              ? 'text-green-600' 
                              : detail.diferencia_stock < 0 
                                ? 'text-red-600' 
                                : 'text-gray-600'
                          }`}>
                            {detail.diferencia_stock > 0 ? '+' : ''}{formatNumber(detail.diferencia_stock)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs">
                          {detail.notes || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Información lateral */}
          <div className="space-y-6">
            {/* Información del movimiento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" />
                  Información del movimiento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Almacén</label>
                  <p className="font-medium">{movimiento.warehouse.nombre}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Creado por</label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{movimiento.created_by.name}</span>
                  </div>
                </div>

                {movimiento.approved_by && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Aprobado por</label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{movimiento.approved_by.name}</span>
                    </div>
                  </div>
                )}

                {movimiento.reason && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Motivo</label>
                    <p className="text-sm">{movimiento.reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumen del movimiento */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen del movimiento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total de productos:</span>
                  <span className="font-medium">{movimiento.details.length}</span>
                </div>
               
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tipo:</span>
                  <Badge variant={getTypeBadgeVariant(movimiento.type)}>
                    {getTypeLabel(movimiento.type)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <Badge variant={getStatusBadgeVariant(movimiento.status)}>
                    {movimiento.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Acciones */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/sucursal/inventario/movimientos`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al listado
                  </Link>
                </Button>
                
                {/* Acciones según estado */}
                {movimiento.status === 'pendiente' && (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={handleCompleteMovement}
                      disabled={isProcessing || hasInsufficientStock()}
                    >
                      {isProcessing ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completar movimiento
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={handleCancelMovement}
                      disabled={isProcessing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar movimiento
                    </Button>
                  </>
                )}
                
                {movimiento.status === 'completado' && (
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleCancelMovement}
                    disabled={isProcessing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar movimiento
                  </Button>
                )}
                
                
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}