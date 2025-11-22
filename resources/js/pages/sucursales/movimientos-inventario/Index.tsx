import HeadingSmall from "@/components/heading-small";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppLayoutOwnership from "@/layouts/app-layout-ownership";
import SucursalPartialLayout from "@/layouts/sucursales/layout-partials";
import { BreadcrumbItem, PaginatedResponse, SucursalItem } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { ArrowDownCircle, ArrowUpCircle, Plus, RefreshCw } from "lucide-react";

interface MovementItem {
  id: number;
  warehouse_name: string;
  product_name: string;
  sku: string;
  type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  performed_by_name: string;
  created_at: string;
}

interface IndexProps {
  sucursal: SucursalItem;
  movements: PaginatedResponse<MovementItem>;
}

export default function MovimientosInventarioIndex({ sucursal, movements }: IndexProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Movimientos de Inventario",
      href: `/sucursales/${sucursal.id}/movimientos-inventario`,
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowDownCircle className="h-4 w-4" />;
      case 'adjust':
        return <RefreshCw className="h-4 w-4" />;
      case 'out':
        return <ArrowUpCircle className="h-4 w-4" />;
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

  return (
    <AppLayoutOwnership breadcrumbs={breadcrumbs}>
      <Head title={`Movimientos de Inventario - ${sucursal.nombre}`} />
      <SucursalPartialLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <HeadingSmall
              title="Movimientos de Inventario"
              description="Historial de entradas, salidas y ajustes de stock"
            />
            <Button size="sm" asChild>
              <Link href={`/sucursales/${sucursal.id}/movimientos-inventario/create`}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar movimiento
              </Link>
            </Button>
          </div>

          {/* Tabla */}
          {movements.data.length === 0 ? (
            <Empty>
              <EmptyMedia>
                <RefreshCw className="h-12 w-12" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No hay movimientos registrados</EmptyTitle>
                <EmptyDescription>
                  Comienza registrando entradas o ajustes de inventario
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href={`/sucursales/${sucursal.id}/movimientos-inventario/create`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar movimiento
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Almacén</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Stock Anterior</TableHead>
                    <TableHead className="text-right">Stock Nuevo</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.data.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-mono text-sm">
                        {movement.created_at}
                      </TableCell>
                      <TableCell>{movement.warehouse_name}</TableCell>
                      <TableCell className="font-medium">{movement.product_name}</TableCell>
                      <TableCell className="font-mono text-sm">{movement.sku}</TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(movement.type)} className="gap-1">
                          {getTypeIcon(movement.type)}
                          {getTypeLabel(movement.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {movement.quantity}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {movement.previous_stock}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {movement.new_stock}
                      </TableCell>
                      <TableCell className="text-sm">{movement.performed_by_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {movement.reason || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación */}
          {movements.links && movements.links.length > 3 && (
            <div className="flex items-center justify-center gap-1">
              {movements.links.map((link, index) => (
                <Button
                  key={index}
                  variant={link.active ? "default" : "outline"}
                  size="sm"
                  disabled={!link.url}
                  onClick={() => {
                    if (link.url) {
                      window.location.href = link.url;
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          )}
        </div>
      </SucursalPartialLayout>
    </AppLayoutOwnership>
  );
}
