// Pages/Sucursales/DetalleNegocio.tsx
import HeadingSmall from "@/components/heading-small";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { BreadcrumbItem, PaginatedResponse, SucursalItem, Almacen } from "@/types";
import { Head, Link, router } from "@inertiajs/react";
import { debounce } from "lodash";
import { Users, User, Pencil, Trash, BadgeCheck, Phone, Clock, Calendar, Plus, Warehouse } from "lucide-react";
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
import AlmacenDialog from "@/components/almacen-dialog";
import almacen from "@/routes/sucursal/almacen";
import sucursal from "@/routes/sucursal";
import AppLayout from "@/layouts/app-layout";

type TrashedFilter = "" | "with" | "only";

interface Filters {
  search?: string;
  sort?: string;
  direction?: "asc" | "desc";
  trashed?: TrashedFilter;
}

type RouterPayload = Record<string, string | number | boolean | null | undefined>;

interface IndexProps {
  items: PaginatedResponse<Almacen>;
  filters: Filters;
  sucursal: SucursalItem;
}
const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Gestion de Inventarios de almacenes",
      href: sucursal.almacen.gestion().url,
    },
  ];

export default function AlmacenesFromEmpleados({ sucursal, items, filters }: IndexProps) {
  

  const [filtersData, setFilters] = useState<Filters>(filters);

  const itemsPrepared = useMemo(() => {
    return items.data.map((alm) => {
      const createdLabel = alm.created_at ?? "No disponible";
      const updatedLabel = alm.updated_at ?? "No disponible";

      return {
        ...alm,
        fullName: `${alm.nombre ?? ""}`.trim(),
        deleteUrl: almacen.delete(alm.id).url,
        createdLabel,
        updatedLabel,
      };
    });
  }, [items.data]);

  const filtersToPayload = (filters: Filters): RouterPayload => {
    return {
      search: filters.search ?? "",
      sort: filters.sort ?? "nombre",
      direction: filters.direction ?? "asc",
      trashed: filters.trashed ?? undefined,
    };
  };

  const debouncedSearch = useMemo(
    () => debounce((filters: Filters) => {
      router.get(almacen.index(sucursal.id).url, filtersToPayload(filters), {
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
      router.get(almacen.index(sucursal.id).url, filtersToPayload(newFilters), {
        preserveState: true,
        replace: true,
      });
    }
  };

  const handleDelete = (id: number | string) => {
    router.delete(almacen.delete(id).url, {
      onSuccess: () => {
        /* refrescar, toast, etc. */
      },
    });
  };

  const handlePageChange = (url: string) => {
    router.get(url, {}, { preserveState: true });
  };

  const resetFilters = () => {
    const resetFilters: Filters = {
      search: "",
      sort: "nombre",
      direction: "asc",
      trashed: "" as TrashedFilter,
    };
    setFilters(resetFilters);
    router.get(almacen.index(sucursal.id).url, filtersToPayload(resetFilters), {
      preserveState: true,
      replace: true,
    });
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Almacenes" />
        <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
          {/* Heading */}
          <div className="flex items-center gap-4">
            <HeadingSmall
              title="Gestión de almacenes"
              description="Aquí puedes administrar los almacenes de tu negocio"
            />

            
          </div>

          {/* Filtros y búsqueda */}
          <Card>
            <CardHeader>
              <CardTitle>Filtrar y buscar almacenes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Búsqueda */}
                <div className="md:col-span-2">
                  <label htmlFor="search" className="block text-sm font-medium mb-2">
                    Buscar almacen
                  </label>
                  <input
                    type="text"
                    id="search"
                    name="search"
                    value={filtersData.search ?? ""}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    placeholder="Buscar por nombre..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Ordenamiento */}
                <div>
                  <label htmlFor="sort" className="block text-sm font-medium mb-2">
                    Ordenar por
                  </label>
                  <select
                    id="sort"
                    name="sort"
                    value={filtersData?.sort ?? "nombre"}
                    onChange={(e) => handleFilterChange("sort", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="nombre">Nombre</option>
                    <option value="ubicacion">Ubicacion</option>
                    <option value="created_at">Fecha de creación</option>
                  </select>
                </div>

                {/* Dirección del orden */}
                <div>
                  <label htmlFor="direction" className="block text-sm font-medium mb-2">
                    Dirección
                  </label>
                  <select
                    id="direction"
                    name="direction"
                    value={filtersData.direction ?? "asc"}
                    onChange={(e) => handleFilterChange("direction", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="asc">Ascendente</option>
                    <option value="desc">Descendente</option>
                  </select>
                </div>

                {/* Selector trashed */}
                <div>
                  <label htmlFor="trashed" className="block text-sm font-medium mb-2">
                    Mostrar eliminados
                  </label>
                  <select
                    id="trashed"
                    name="trashed"
                    value={filtersData.trashed ?? ""}
                    onChange={(e) => handleFilterChange("trashed", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Sin filtro</option>
                    <option value="with">Incluir eliminados</option>
                    <option value="only">Solo eliminados</option>
                  </select>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {items.data.length} de {items.total} empleados
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de empleados o estado vacío */}
          {itemsPrepared.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia>
                  <Users className="w-16 h-16 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>No hay almacenes registrados</EmptyTitle>
                <EmptyDescription>
                  Aún no tienes alamcenes. Agrega el primero para comenzar a gestionar.
                </EmptyDescription>
              </EmptyHeader>

              <EmptyContent>
                <div className="flex justify-center">
                  <AlmacenDialog
                    sucursalId={sucursal.id}
                    mode="create"
                    trigger={
                      <Button className="inline-flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Agregar Almacen
                      </Button>
                    }
                  />
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              {/* Grid de empleados */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {itemsPrepared.map((altItem) => (
                  <Card key={altItem.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold">
                              {altItem.nombre}
                            </CardTitle>
                            <CardDescription>
                              {altItem.descripcion?? "sin descripcion"}
                            </CardDescription>
                          </div>
                        </div>

                        <CardAction></CardAction>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Warehouse className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            {altItem.ubicacion || "No especificado"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <BadgeCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            {altItem.activo ? "Almacen activo" : "Almacen activo"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            Registrado: {altItem.createdLabel}
                          </p>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-3">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Última Actualización: {altItem.updatedLabel}
                      </div>
                      <div className="flex items-center gap-2">
                        {!altItem.deleted_at ? (
                          <>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={almacen.inventarioEmpleado({id: altItem.id }).url} className="p-2 rounded-md hover:bg-gray-200 transition-colors">
                                    <Warehouse className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ver inventario</p>
                              </TooltipContent>
                            </Tooltip>
                            
                          </>
                        ) : (
                          <Badge variant="default" className="bg-red-500 hover:bg-red-600">
                            Eliminado
                          </Badge>
                        )}

                        {altItem.activo ? (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Inactivo</Badge>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Paginación */}
              {items.links.length > 3 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {items.from} a {items.to} de {items.total} resultados
                      </div>

                      <div className="flex gap-1">
                        {items.links.map((link, index) => (
                          <button
                            key={index}
                            onClick={() => link.url && handlePageChange(link.url)}
                            disabled={!link.url || link.active}
                            className={`px-3 py-1 text-sm rounded-md ${
                              link.active
                                ? "bg-primary text-white"
                                : link.url
                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                : "bg-gray-50 text-gray-400 cursor-not-allowed"
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
    </AppLayout>
  );
}