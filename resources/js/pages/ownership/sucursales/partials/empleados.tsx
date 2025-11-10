// Pages/Sucursales/DetalleNegocio.tsx
import HeadingSmall from "@/components/heading-small";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import AppLayoutOwnership from "@/layouts/app-layout-ownership";
import SucursalPartialLayout from "@/layouts/sucursales/layout-partials";
import { BreadcrumbItem, PaginatedResponse, Empleado as EmpleadoType, SucursalItem } from "@/types";
import { Head, router } from "@inertiajs/react";
import { debounce } from "lodash";
import { Users, User, Pencil, Trash, BadgeCheck, Phone, Clock, Calendar, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmpleadoDialog } from "@/components/empleado-dialog";
import empleado from '@/routes/sucursal/empleado';

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

type TrashedFilter = "" | "with" | "only";

interface Filters {
  search?: string;
  sort?: string;
  direction?: "asc" | "desc";
  trashed?: TrashedFilter;
}

type RouterPayload = Record<string, string | number | boolean | null | undefined>;

interface IndexProps {
  items: PaginatedResponse<EmpleadoType>;
  filters: Filters;
  hasSucursales: boolean;
  total: number;
  sucursal: SucursalItem;
}

export default function Empleados({ sucursal, items, filters, hasSucursales, total }: IndexProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Empleados",
      href: empleado.index(sucursal.id).url,
    },
  ];
  const [filtersData, setFilters] = useState<Filters>(filters);

  const itemsPrepared = useMemo(() => {
    return items.data.map((emp) => {
      const createdLabel = emp.created_at ?? "No disponible";
      const updatedLabel = emp.updated_at ?? "No disponible";

      return {
        ...emp,
        fullName: `${emp.nombre} ${emp.apellidos ?? ""}`.trim(),
        editUrl: empleado.edit(emp.id).url,
        deleteUrl: empleado.delete(emp.id).url,
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

  const debouncedSearch = useCallback(
    debounce((filters: Filters) => {
      router.get(empleado.index(sucursal.id).url, filtersToPayload(filters), {
        preserveState: true,
        replace: true,
      });
    }, 500),
    []
  );

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters: Filters = {
      ...filtersData,
      [key]: key === "direction" ? ((value as "asc" | "desc") as any) : value,
    };
    setFilters(newFilters);

    if (key === "search") {
      debouncedSearch(newFilters);
    } else {
      router.get(empleado.index(sucursal.id).url, filtersToPayload(newFilters), {
        preserveState: true,
        replace: true,
      });
    }
  };

  const handleDelete = (id: number | string) => {
    router.delete(empleado.delete(id).url, {
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
    router.get(empleado.index(sucursal.id).url, filtersToPayload(resetFilters), {
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
    <AppLayoutOwnership breadcrumbs={breadcrumbs}>
      <Head title="Empleados" />
      <SucursalPartialLayout>
        <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
          {/* Heading */}
          <div className="flex items-center gap-4">
            <HeadingSmall
              title="Gestión de empleados"
              description="Aquí puedes administrar los empleados de tu negocio"
            />

            {/* Botón para agregar empleado con Dialog */}
            <EmpleadoDialog
              sucursalId={sucursal.id}
              mode="create"
              trigger={
                <Button className="ml-auto inline-flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Agregar Empleado
                </Button>
              }
            />
          </div>

          {/* Filtros y búsqueda */}
          <Card>
            <CardHeader>
              <CardTitle>Filtrar y buscar empleados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Búsqueda */}
                <div className="md:col-span-2">
                  <label htmlFor="search" className="block text-sm font-medium mb-2">
                    Buscar empleados
                  </label>
                  <input
                    type="text"
                    id="search"
                    name="search"
                    value={filtersData.search ?? ""}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    placeholder="Buscar por nombre, apellidos, teléfono..."
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
                    <option value="apellidos">Apellidos</option>
                    <option value="edad">Edad</option>
                    <option value="telefono">Teléfono</option>
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
                <EmptyTitle>No hay empleados registrados</EmptyTitle>
                <EmptyDescription>
                  Aún no tienes empleados. Agrega el primero para comenzar a gestionar.
                </EmptyDescription>
              </EmptyHeader>

              <EmptyContent>
                <div className="flex justify-center">
                  <EmpleadoDialog
                    sucursalId={sucursal.id}
                    mode="create"
                    trigger={
                      <Button className="inline-flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Agregar Empleado
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
                {itemsPrepared.map((empleadoItem) => (
                  <Card key={empleadoItem.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold">
                              {empleadoItem.fullName}
                            </CardTitle>
                            <CardDescription>
                              {empleadoItem.edad ? `${empleadoItem.edad} años` : "Edad no especificada"}
                            </CardDescription>
                          </div>
                        </div>

                        <CardAction></CardAction>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            {empleadoItem.telefono || "No especificado"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <BadgeCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            {empleadoItem.activo ? "Empleado activo" : "Empleado inactivo"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            Registrado: {empleadoItem.createdLabel}
                          </p>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-3">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Última Actualización: {empleadoItem.updatedLabel}
                      </div>
                      <div className="flex items-center gap-2">
                        {!empleadoItem.deleted_at ? (
                          <>
                            {/* Botón de editar con Dialog */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <EmpleadoDialog
                                    sucursalId={sucursal.id}
                                    empleadoData={empleadoItem}
                                    mode="edit"
                                    trigger={
                                      <button className="p-2 rounded-md transition-colors hover:bg-gray-400">
                                        <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                      </button>
                                    }
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar empleado</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button className="p-2 rounded-md hover:bg-red-50 transition-colors">
                                        <Trash className="w-4 h-4 text-red-500 hover:text-red-700" />
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción eliminará permanentemente al empleado{" "}
                                          <strong>{empleadoItem.fullName}</strong>. Esta acción no se puede deshacer.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(empleadoItem.id)}
                                          className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                                        >
                                          Eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Eliminar empleado</p>
                              </TooltipContent>
                            </Tooltip>
                          </>
                        ) : (
                          <Badge variant="default" className="bg-red-500 hover:bg-red-600">
                            Eliminado
                          </Badge>
                        )}

                        {empleadoItem.activo ? (
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
      </SucursalPartialLayout>
    </AppLayoutOwnership>
  );
}