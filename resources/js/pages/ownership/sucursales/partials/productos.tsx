import HeadingSmall from "@/components/heading-small";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import AppLayoutOwnership from "@/layouts/app-layout-ownership";
import SucursalPartialLayout from "@/layouts/sucursales/layout-partials";
import { BreadcrumbItem, PaginatedResponse, SucursalItem } from "@/types";
import { Head, router, Link } from "@inertiajs/react";
import { debounce } from "lodash";
import { Boxes, Pencil, Trash, Plus, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ProductoDialog from "@/components/producto-dialog";
import productos from "@/routes/sucursales/productos";

interface ProductoItem {
  id: number;
  product_base_id: number;
  name: string;
  sku_base: string;
  brand: string;
  category: string;
  unit: string;
  price: string;
  stock: number;
  created_at: string;
  updated_at: string;
}

interface Filters {
  search?: string;
  brand_id?: string;
  category_id?: string;
  sort?: string;
  direction?: "asc" | "desc";
}

type RouterPayload = Record<string, string | number | boolean | null | undefined>;

interface IndexProps {
  items: PaginatedResponse<ProductoItem>;
  filters: Filters;
  sucursal: SucursalItem;
}

export default function Productos({ sucursal, items, filters }: IndexProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Productos",
      href: productos.index(sucursal.id).url,
    },
  ];

  const [filtersData, setFilters] = useState<Filters>(filters);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductoItem | null>(null);

  const itemsPrepared = useMemo(() => {
    return items.data.map((prod) => ({
      ...prod,
      deleteUrl: productos.destroy(sucursal.id, prod.id).url,
    }));
  }, [items.data, sucursal.id]);

  const filtersToPayload = (filters: Filters): RouterPayload => {
    return {
      search: filters.search ?? "",
      brand_id: filters.brand_id ?? undefined,
      category_id: filters.category_id ?? undefined,
      sort: filters.sort ?? "created_at",
      direction: filters.direction ?? "desc",
    };
  };

  const debouncedSearch = useMemo(
    () => debounce((filters: Filters) => {
      router.get(productos.index(sucursal.id).url, filtersToPayload(filters), {
        preserveState: true,
        replace: true,
      });
    }, 500),
    [sucursal.id]
  );

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters: Filters = {
      ...filtersData,
      [key]: value,
    };
    setFilters(newFilters);

    if (key === "search") {
      debouncedSearch(newFilters);
    } else {
      router.get(productos.index(sucursal.id).url, filtersToPayload(newFilters), {
        preserveState: true,
        replace: true,
      });
    }
  };

  const handleDelete = (deleteUrl: string) => {
    router.delete(deleteUrl, {
      preserveScroll: true,
      onSuccess: () => {
        router.reload({ only: ["items"] });
      },
    });
  };

  const handleEdit = (item: ProductoItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const isSuperAdmin = useMemo(() => {
    // Verificar si el usuario es super_admin
    return (window as any).Laravel?.user?.type === 'super_admin';
  }, []);

  return (
    <AppLayoutOwnership breadcrumbs={breadcrumbs}>
      <Head title={`Productos - ${sucursal.nombre}`} />
      <SucursalPartialLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <HeadingSmall
              title="Productos"
              description="Gestiona los precios de productos en esta sucursal"
            />
            <div className="flex gap-2">
              {isSuperAdmin && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/management/product-bases">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Catálogo corporativo
                  </Link>
                </Button>
              )}
              <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar precio
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={filtersData.search ?? ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Lista de productos */}
          {itemsPrepared.length === 0 ? (
            <Empty>
              <EmptyMedia>
                <Boxes className="h-12 w-12" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No hay productos registrados</EmptyTitle>
                <EmptyDescription>
                  Aún no tienes productos. Agrega el primero para comenzar a gestionar.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar precio
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {itemsPrepared.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <CardDescription>SKU: {item.sku_base}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Marca:</span>
                      <span className="font-medium">{item.brand}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Categoría:</span>
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Unidad:</span>
                      <span className="font-medium">{item.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Precio:</span>
                      <span className="font-bold text-lg">${item.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stock:</span>
                      <Badge variant={item.stock > 0 ? "default" : "destructive"}>
                        {item.stock} {item.unit}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar</p>
                      </TooltipContent>
                    </Tooltip>

                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Eliminar</p>
                        </TooltipContent>
                      </Tooltip>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará el precio de "{item.name}" de esta sucursal.
                            El producto seguirá existiendo en el catálogo corporativo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.deleteUrl)}
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Paginación */}
          {items.links && items.links.length > 3 && (
            <div className="flex justify-center gap-1">
              {items.links.map((link, index) => (
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

        <ProductoDialog
          open={isDialogOpen}
          onClose={handleDialogClose}
          sucursalId={sucursal.id}
          editingItem={editingItem}
        />
      </SucursalPartialLayout>
    </AppLayoutOwnership>
  );
}
