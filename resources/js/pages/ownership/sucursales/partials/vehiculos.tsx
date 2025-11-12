import vehiculo from "@/routes/sucursal/vehiculo";
import { BreadcrumbItem, PaginatedResponse, SucursalItem, Vehiculo } from "@/types";
import { Head, router } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import { debounce } from "lodash";
import AppLayoutOwnership from "@/layouts/app-layout-ownership";
import SucursalPartialLayout from "@/layouts/sucursales/layout-partials";
import HeadingSmall from "@/components/heading-small";
import { VehiculoDialog } from "@/components/vehiculo-dialog";
import { Button } from "@headlessui/react";
import { Caravan, Clock, Pencil, Plus, Trash } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AlertDialogDescription } from "@radix-ui/react-alert-dialog";
import { Badge } from "@/components/ui/badge";


type TrashedFilter = "" | "with" | "only";

interface Filters {
  search?: string;
  sort?: string;
  direction?: "asc" | "desc";
  trashed?: TrashedFilter;
}

type RouterPayload = Record<string, string | number | boolean | null | undefined>;

interface IndexProps {
  items: PaginatedResponse<Vehiculo>;
  filters: Filters;
  sucursal: SucursalItem;
}

export default function Vehiculos({sucursal, items, filters}: IndexProps){
    const breadcrumbs: BreadcrumbItem[] = [
        {
          title: "Vehiculos",
          href: vehiculo.index(sucursal.id).url,
        },
      ];
    
      const [filtersData, setFilters] = useState<Filters>(filters);
    
      const itemsPrepared = useMemo(() => {
        return items.data.map((vehi) => {
            
          const createdLabel = vehi.created_at ?? "No disponible";
          const updatedLabel = vehi.updated_at ?? "No disponible";
    
          return {
            ...vehi,
            createdLabel,
            updatedLabel,
          };
        });
      }, [items.data]);
    
      const filtersToPayload = (filters: Filters): RouterPayload => {
        return {
          search: filters.search ?? "",
          sort: filters.sort ?? "modelo",
          direction: filters.direction ?? "asc",
          trashed: filters.trashed ?? undefined,
        };
      };
    
      const debouncedSearch = useMemo(
        () => debounce((filters: Filters) => {
          router.get(vehiculo.index(sucursal.id).url, filtersToPayload(filters), {
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
          router.get(vehiculo.index(sucursal.id).url, filtersToPayload(newFilters), {
            preserveState: true,
            replace: true,
          });
        }
      };
    
      const handleDelete = (id: number | string) => {
        router.delete(vehiculo.delete(id).url, {
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
        router.get(vehiculo.index(sucursal.id).url, filtersToPayload(resetFilters), {
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
    <Head title="Vehículos" />
    <SucursalPartialLayout>
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* Heading */}
        <div className="flex items-center gap-4">
          <HeadingSmall
            title="Gestión de vehículos"
            description="Aquí puedes administrar los vehículos de tu negocio"
          />

          {/* Botón para agregar vehículo con Dialog */}
          <div className="ml-auto">
            <VehiculoDialog
              sucursalId={sucursal.id}
              mode="create"
              trigger={
                <Button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-white">
                  <Plus className="w-5 h-5" />
                  Agregar vehículo
                </Button>
              }
            />
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrar y buscar vehículos</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div className="md:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium mb-2">
                  Buscar vehículo
                </label>
                <input
                  type="text"
                  id="search"
                  name="search"
                  value={filtersData.search ?? ""}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Buscar por placa, marca o modelo..."
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
                  value={filtersData?.sort ?? "modelo"}
                  onChange={(e) => handleFilterChange("sort", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="modelo">Modelo</option>
                  <option value="marca">Marca</option>
                  <option value="placa">Placa</option>
                  <option value="created_at">Fecha de creación</option>
                </select>
              </div>

              {/* Dirección del orden / trashed */}
              <div>
                <label htmlFor="direction" className="block text-sm font-medium mb-2">
                  Dirección
                </label>
                <select
                  id="direction"
                  name="direction"
                  value={filtersData.direction ?? "asc"}
                  onChange={(e) => handleFilterChange("direction", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary mb-3"
                >
                  <option value="asc">Ascendente</option>
                  <option value="desc">Descendente</option>
                </select>

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
                Mostrando {items.data.length} de {items.total} vehículos
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={resetFilters as any}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista o vacío */}
        {itemsPrepared.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia>
                <Caravan className="w-16 h-16 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No hay vehículos registrados</EmptyTitle>
              <EmptyDescription>
                Aún no tienes vehículos. Agrega el primero para comenzar a gestionar.
              </EmptyDescription>
            </EmptyHeader>

            <EmptyContent>
              <div className="flex justify-center">
                <VehiculoDialog
                  sucursalId={sucursal.id}
                  mode="create"
                  trigger={
                    <Button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-white">
                      <Plus className="w-4 h-4" />
                      Agregar vehículo
                    </Button>
                  }
                />
              </div>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            {/* Grid de vehículos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itemsPrepared.map((vehi) => (
                <Card key={vehi.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Caravan className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold">
                                    {`${vehi.marca} ${vehi.modelo}`}
                                </CardTitle>
                            </div>
                        </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="">
                            <strong>Placa:</strong> {vehi.placa}
                        </div>

                        <div className="">
                            <strong>Tipo:</strong> {vehi.tipo}
                        </div>
                      {/* Especificaciones principales */}
                      <div>
                        <strong>Capacidad de carga:</strong>{" "}
                        {vehi.capacidad_carga_kg ? `${vehi.capacidad_carga_kg} kg` : "—"}
                      </div>

                      <div>
                        <strong>Rendimiento (km/L):</strong>{" "}
                        {vehi.kilometros_por_litro ? `${vehi.kilometros_por_litro} km/L` : "—"}
                      </div>

                      <div>
                        <strong>Precio combustible: $MXN</strong>{" "}
                        {vehi.precio_litro_combustible ? `${vehi.precio_litro_combustible} / L` : "—"}
                      </div>

                      {/* Estado y metadatos */}
                      <div>
                        <strong>Estado:</strong> {vehi.estado}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <strong>Registrado:</strong> {vehi.createdLabel}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-3">
                        <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Última Actualización: {vehi.updatedLabel}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {!vehi.deleted_at ? (
                            <>
                            {/* Botón de editar con Dialog */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div>
                                        <VehiculoDialog
                                            sucursalId={sucursal.id}
                                            vehiculoData={vehi}
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
                                    <p>Editar Vehículo</p>
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
                                                        Esta acción eliminará permanentemente el vehículo{" "}
                                                        <strong>{vehi.modelo}</strong>. Esta acción no se puede deshacer.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDelete(vehi.id)}
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
                                    <p>Eliminar vehículo</p>
                                </TooltipContent>
                            </Tooltip>
                            </>
                          ) : (
                            <Badge variant="default" className="bg-red-500 hover:bg-red-600">
                              Eliminado
                            </Badge>
                          )}
  
                            {vehi.estado === "activo" ? (
                                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                    Activo
                                </Badge>
                            ) : vehi.estado === "mantenimiento" ? (
                                <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                                    Mantenimiento
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
            {items.links.length > 10 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {items.from} a {items.to} de {items.total} resultados
                    </div>

                    <div className="flex gap-1">
                      {items.links.map((link, index) => (
                        <button
                          key={`pagination-${link.label}-${index}`}
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