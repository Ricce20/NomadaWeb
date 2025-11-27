import HeadingSmall from "@/components/heading-small";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";
import { getSaleTypeLabel } from "@/lib/sale-types";
import { BreadcrumbItem, SucursalItem, PaginatedResponse } from "@/types";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, Package, AlertTriangle, MapPin, Search, ArrowUpDown } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { debounce } from "lodash";

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
  min_stock: number | null;
  is_low_stock: boolean;
}

interface Filters {
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  perPage?: number;
}

interface InventoryProps {
  sucursal: SucursalItem;
  almacen: WarehouseInfo;
  inventory: PaginatedResponse<InventoryItem>;
  filters: Filters;
}

export default function WarehouseInventory({ 
  sucursal, 
  almacen, 
  inventory, 
  filters
}: InventoryProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Almacénes",
      href: `/sucursal/gestion/almacenes`,
    },
    {
      title: almacen.nombre,
      href: `/sucursal/almacen/${almacen.id}/inventario`,
    },
  ];

  const [filtersData, setFilters] = useState<Filters>(filters);

  const totalStock = useMemo(() => 
    inventory.data.reduce((sum, item) => sum + item.stock, 0), 
    [inventory.data]
  );
  
  const lowStockCount = useMemo(() => 
    inventory.data.filter((item) => item.is_low_stock).length, 
    [inventory.data]
  );

  const filtersToPayload = (filters: Filters) => {
    return {
      search: filters.search ?? "",
      sortBy: filters.sortBy ?? "stock",
      sortDirection: filters.sortDirection ?? "desc",
      perPage: filters.perPage ?? 15,
    };
  };

  const debouncedSearch = useMemo(
    () => debounce((filters: Filters) => {
      router.get(`/sucursal/almacen/${almacen.id}/inventario`, filtersToPayload(filters), {
        preserveState: true,
        replace: true,
      });
    }, 500),
    [almacen.id]
  );

  const handleFilterChange = (key: keyof Filters, value: string | number) => {
    const newFilters: Filters = {
      ...filtersData,
      [key]: value,
    };
    
    setFilters(newFilters);

    if (key === "search") {
      debouncedSearch(newFilters);
    } else {
      router.get(`/sucursal/almacen/${almacen.id}/inventario`, filtersToPayload(newFilters), {
        preserveState: true,
        replace: true,
      });
    }
  };

  const handleSort = (column: string) => {
    const newFilters: Filters = {
      ...filtersData,
      sortBy: column,
      sortDirection: filtersData.sortBy === column && filtersData.sortDirection === "asc" ? "desc" : "asc",
    };
    
    setFilters(newFilters);
    router.get(`/sucursal/almacen/${almacen.id}/inventario`, filtersToPayload(newFilters), {
      preserveState: true,
      replace: true,
    });
  };

  const handlePageChange = (url: string) => {
    router.get(url, {}, { preserveState: true });
  };

  const resetFilters = () => {
    const resetFilters: Filters = {
      search: "",
      sortBy: "stock",
      sortDirection: "desc",
      perPage: 15,
    };
    setFilters(resetFilters);
    router.get(`/sucursal/almacen/${almacen.id}/inventario`, filtersToPayload(resetFilters), {
      preserveState: true,
      replace: true,
    });
  };

  const getSortIcon = (column: string) => {
    if (filtersData.sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return filtersData.sortDirection === "asc" ? "↑" : "↓";
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${almacen.nombre} - ${sucursal.nombre}`} />
      
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <HeadingSmall
                title={almacen.nombre}
                description={almacen.descripcion || "Inventario del almacén"}
              />
              <Badge variant={almacen.activo ? "default" : "secondary"}>
                {almacen.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            
            {almacen.ubicacion && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{almacen.ubicacion}</span>
              </div>
            )}
          </div>
          
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href={`/sucursal/gestion/almacenes`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a almacenes
            </Link>
          </Button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inventory.total}</p>
                <p className="text-sm text-muted-foreground">Productos totales</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/10 p-3">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStock.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Unidades en stock</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-500/10 p-3">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowStockCount}</p>
                <p className="text-sm text-muted-foreground">Productos con stock bajo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={filtersData.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={filtersData.perPage || 15}
              onChange={(e) => handleFilterChange("perPage", parseInt(e.target.value))}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="10">10 por página</option>
              <option value="15">15 por página</option>
              <option value="25">25 por página</option>
              <option value="50">50 por página</option>
            </select>
            
            {(filtersData.search || filtersData.perPage !== 15) && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Tabla de inventario */}
        {inventory.data.length === 0 ? (
          <div className="border rounded-lg p-8">
            <Empty>
              <EmptyMedia>
                <Package className="h-12 w-12" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>
                  {filtersData.search ? "No se encontraron productos" : "No hay productos en este almacén"}
                </EmptyTitle>
                <EmptyDescription>
                  {filtersData.search 
                    ? "No se encontraron productos que coincidan con tu búsqueda."
                    : "Este almacén no tiene productos registrados en el inventario."
                  }
                </EmptyDescription>
              </EmptyHeader>
              {filtersData.search && (
                <EmptyContent>
                  <Button variant="outline" onClick={resetFilters}>
                    Limpiar búsqueda
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          </div>
        ) : (
          <div className="rounded-lg border shadow-sm">
            <div className="p-4 border-b bg-muted/50 flex justify-between items-center">
              <h3 className="font-semibold">Inventario del almacén</h3>
              <div className="text-sm text-muted-foreground">
                Mostrando {inventory.from}-{inventory.to} de {inventory.total} productos
              </div>
            </div>
            <div className="p-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%] px-4 py-3">
                      <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent font-medium"
                        onClick={() => handleSort("product_name")}
                      >
                        Producto {getSortIcon("product_name")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[15%] px-4 py-3">
                      <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent font-medium"
                        onClick={() => handleSort("sku")}
                      >
                        SKU {getSortIcon("sku")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[15%] px-4 py-3">
                      Tipo de venta
                    </TableHead>
                    <TableHead className="w-[15%] px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent font-medium float-right"
                        onClick={() => handleSort("stock")}
                      >
                        Stock actual {getSortIcon("stock")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[15%] px-4 py-3 text-center">
                      Estado
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.data.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium px-4 py-3">{item.product_name}</TableCell>
                      <TableCell className="font-mono text-sm px-4 py-3">{item.sku}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {getSaleTypeLabel(item.sale_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-4 py-3">
                        <span className={`font-mono font-semibold ${item.is_low_stock ? 'text-orange-600' : 'text-foreground'}`}>
                          {item.stock.toLocaleString()}
                        </span>
                      </TableCell>
                     
                      <TableCell className="text-center px-4 py-3">
                        {item.is_low_stock ? (
                          <Badge variant="destructive" className="gap-1 px-2 py-1">
                            <AlertTriangle className="h-3 w-3" />
                            Stock bajo
                          </Badge>
                        ) : item.stock > 0 ? (
                          <Badge variant="default" className="px-2 py-1">Disponible</Badge>
                        ) : (
                          <Badge variant="secondary" className="px-2 py-1">Sin stock</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {inventory.links && inventory.links.length > 3 && (
              <div className="flex items-center justify-center gap-1">
                {inventory.links.map((link, index) => (
                  <Button
                    key={index}
                    variant={link.active ? "default" : "outline"}
                    size="sm"
                    disabled={!link.url}
                    onClick={() => {
                      if (link.url) {
                        router.get(link.url);
                      }
                    }}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nota informativa */}
        <div className="rounded-lg border bg-muted/50 p-6">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Vista de solo lectura</p>
              <p className="text-sm text-muted-foreground">
                Esta vista muestra el inventario actual del almacén. Para realizar movimientos
                de inventario (entradas, salidas, ajustes), ve a la seccion de movimientos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}