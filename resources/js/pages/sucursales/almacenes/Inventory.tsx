import HeadingSmall from "@/components/heading-small";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppLayoutOwnership from "@/layouts/app-layout-ownership";
import SucursalPartialLayout from "@/layouts/sucursales/layout-partials";
import { getSaleTypeLabel } from "@/lib/sale-types";
import { BreadcrumbItem, SucursalItem } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Package, AlertTriangle } from "lucide-react";

interface WarehouseInfo {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  ubicacion: string;
}

interface InventoryItem {
  id: number;
  product_name: string;
  sku: string;
  sale_type: string;
  stock: number;
  is_low_stock: boolean;
}

interface InventoryProps {
  sucursal: SucursalItem;
  almacen: WarehouseInfo;
  inventory: InventoryItem[];
}

export default function WarehouseInventory({ sucursal, almacen, inventory }: InventoryProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Almacénes",
      href: `/sucursal/${sucursal.id}/almacenes/index`,
    },
    {
      title: almacen.nombre,
      href: `/sucursal/${sucursal.id}/almacen/${almacen.id}`,
    },
  ];

  const totalStock = inventory.reduce((sum, item) => sum + item.stock, 0);
  const lowStockCount = inventory.filter((item) => item.is_low_stock).length;

  return (
    <AppLayoutOwnership breadcrumbs={breadcrumbs}>
      <Head title={`${almacen.nombre} - ${sucursal.nombre}`} />
      <SucursalPartialLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <HeadingSmall
                  title={almacen.nombre}
                  description={almacen.descripcion || "Inventario del almacén"}
                />
                
                <Badge variant={almacen.activo ? "default" : "secondary"}>
                  {almacen.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              {almacen.ubicacion && (
                <p className="text-sm text-muted-foreground">
                  Ubicación: {almacen.ubicacion}
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/sucursal/${sucursal.id}/almacenes/index`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inventory.length}</p>
                  <p className="text-sm text-muted-foreground">Productos</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-500/10 p-3">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStock}</p>
                  <p className="text-sm text-muted-foreground">Stock total</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-orange-500/10 p-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{lowStockCount}</p>
                  <p className="text-sm text-muted-foreground">Stock bajo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de inventario */}
          {inventory.length === 0 ? (
            <Empty>
              <EmptyMedia>
                <Package className="h-12 w-12" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No hay productos en este almacén</EmptyTitle>
                <EmptyDescription>
                  Este almacén no tiene productos registrados todavía.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Tipo de venta</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {getSaleTypeLabel(item.sale_type)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono font-semibold ${item.is_low_stock ? 'text-orange-600' : ''}`}>
                          {item.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.is_low_stock ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Stock bajo
                          </Badge>
                        ) : item.stock > 0 ? (
                          <Badge variant="default">Disponible</Badge>
                        ) : (
                          <Badge variant="secondary">Sin stock</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Nota informativa */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex gap-3">
              <Package className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Vista de solo lectura</p>
                <p className="text-sm text-muted-foreground">
                  Esta vista muestra el inventario actual del almacén. Para realizar movimientos
                  de inventario (entradas, salidas, ajustes), contacta con un administrador.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SucursalPartialLayout>
    </AppLayoutOwnership>
  );
}