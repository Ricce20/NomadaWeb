import HeadingSmall from "@/components/heading-small";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import AppLayoutOwnership from "@/layouts/app-layout-ownership";
import SucursalPartialLayout from "@/layouts/sucursales/layout-partials";
import { BreadcrumbItem, SucursalItem } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { Package, Warehouse, Eye } from "lucide-react";

interface WarehouseItem {
  id: number;
  name: string;
  description: string | null;
  is_default: boolean;
  status: string;
  total_products: number;
  total_stock: number;
}

interface DashboardProps {
  sucursal: SucursalItem;
  warehouses: WarehouseItem[];
}

export default function WarehouseDashboard({ sucursal, warehouses }: DashboardProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Inventario por almacén",
      href: `/sucursales/${sucursal.id}/inventario`,
    },
  ];

  return (
    <AppLayoutOwnership breadcrumbs={breadcrumbs}>
      <Head title={`Inventario - ${sucursal.nombre}`} />
      <SucursalPartialLayout>
        <div className="space-y-6">
          {/* Header */}
          <HeadingSmall
            title="Inventario por almacén"
            description="Consulta el inventario de cada almacén de la sucursal"
          />

          {/* Lista de almacenes */}
          {warehouses.length === 0 ? (
            <Empty>
              <EmptyMedia>
                <Warehouse className="h-12 w-12" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No hay almacenes registrados</EmptyTitle>
                <EmptyDescription>
                  Esta sucursal no tiene almacenes configurados todavía.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouses.map((warehouse) => (
                <Card key={warehouse.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        {warehouse.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                        <Badge
                          variant={warehouse.status === "active" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {warehouse.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>
                    {warehouse.description && (
                      <CardDescription className="line-clamp-2">
                        {warehouse.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Métricas */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold">
                            {warehouse.total_products}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Productos
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold">
                            {warehouse.total_stock}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Stock total
                          </span>
                        </div>
                      </div>

                      {/* Botón ver inventario */}
                      <Button
                        asChild
                        className="w-full"
                        size="sm"
                        variant="outline"
                      >
                        <Link href={`/sucursales/${sucursal.id}/inventario/${warehouse.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver inventario
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Nota informativa */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex gap-3">
              <Package className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Vista de solo lectura</p>
                <p className="text-sm text-muted-foreground">
                  Este dashboard muestra el inventario actual de cada almacén. Para gestionar
                  almacenes o realizar movimientos de inventario, contacta con un administrador.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SucursalPartialLayout>
    </AppLayoutOwnership>
  );
}
