
import { BreadcrumbItem, Cliente, PaginatedResponse } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { debounce } from "lodash";
import { Head, Link, router } from "@inertiajs/react";
import cliente from "@/routes/sucursal/cliente";
import AppLayoutOwnership from "@/layouts/app-layout-ownership";
import HeadingSmall from "@/components/heading-small";
import { BadgeCheck, Calendar, Caravan, Clock, Pencil, Phone, Plus, Trash, User } from "lucide-react";
import { ClienteDialog } from "@/components/cliente-dialog";
import { Button } from "@headlessui/react";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { VehiculoDialog } from "@/components/vehiculo-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/layouts/app-layout";
import pedido from "@/routes/sucursal/pedido";


type TrashedFilter = "" | "with" | "only";

interface Filters {
  search?: string;
  sort?: string;
  direction?: "asc" | "desc";
  trashed?: TrashedFilter;
}

type RouterPayload = Record<string, string | number | boolean | null | undefined>;

interface IndexProps {
  items: PaginatedResponse<Cliente>;
  filters: Filters;
}
const breadcrumbs:BreadcrumbItem[] = [
    {
        title:"Nuestro Clientes",
        href: cliente.negocio.index().url,
    }
];

export default function Clientes({items,filters}:IndexProps){
    
     const [filtersData, setFilters] = useState<Filters>(filters);

  const itemsPrepared = useMemo(() => {
    return items.data.map((emp) => {
      const createdLabel = emp.created_at ?? "No disponible";
      const updatedLabel = emp.updated_at ?? "No disponible";

      return {
        ...emp,
        fullName: `${emp.nombre} ${emp.apellidos ?? ""}`.trim(),
        editUrl: cliente.update(emp.id).url,
        generarPedidoUrl: pedido.crearLocal(emp.id).url,
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
      router.get(cliente.negocio.index().url, filtersToPayload(filters), {
        preserveState: true,
        replace: true,
      });
    }, 500),
    [cliente]
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
      router.get(cliente.negocio.index().url, filtersToPayload(newFilters), {
        preserveState: true,
        replace: true,
      });
    }
  };

  const handleDelete = (id: number | string) => {
    router.delete(cliente.delete(id).url, {
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
    router.get(cliente.negocio.index().url, filtersToPayload(resetFilters), {
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
          <Head title="Clientes"/>

          <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
              {/* Heading */}
              <div className="flex items-center gap-4">
                  <HeadingSmall
                      title="Gestión de Clientes"
                      description="Aquí puedes administrar los clientes de tu negocio"
                    />
                     {/* Botón para agregar cliente con Dialog */}
                <div className="ml-auto">
                  <ClienteDialog
                      mode="create"
                      trigger={
                      <Button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-white">
                          <Plus className="w-5 h-5" />
                            Registrar Cliente Nuevo
                      </Button>
                    }
                  />
                </div>
              </div>
          

          {/* Filtros y búsqueda */}
          <Card className=" mx-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Filtros rápidos</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap items-end gap-3">
                {/* Buscar */}
                <div className="flex-1 min-w-[220px]">
                  <label htmlFor="search" className="block text-xs font-medium mb-1">
                    Buscar
                  </label>
                  <input
                    type="text"
                    id="search"
                    value={filtersData.search ?? ""}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    placeholder="Nombre, teléfono..."
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Ordenar */}
                <div>
                  <label htmlFor="sort" className="block text-xs font-medium mb-1">
                    Ordenar por
                  </label>
                  <select
                    id="sort"
                    value={filtersData.sort ?? "nombre"}
                    onChange={(e) => handleFilterChange("sort", e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="nombre">Nombre</option>
                    <option value="apellidos">Apellidos</option>
                    <option value="telefono">Teléfono</option>
                    <option value="created_at">Fecha de creación</option>
                  </select>
                </div>

                {/* Dirección */}
                <div>
                  <label htmlFor="direction" className="block text-xs font-medium mb-1">
                    Dirección
                  </label>
                  <select
                    id="direction"
                    value={filtersData.direction ?? "asc"}
                    onChange={(e) => handleFilterChange("direction", e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="asc">Ascendente</option>
                    <option value="desc">Descendente</option>
                  </select>
                </div>

                {/* Eliminados */}
                <div>
                  <label htmlFor="trashed" className="block text-xs font-medium mb-1">
                    Eliminados
                  </label>
                  <select
                    id="trashed"
                    value={filtersData.trashed ?? ""}
                    onChange={(e) => handleFilterChange("trashed", e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Sin filtro</option>
                    <option value="with">Incluir</option>
                    <option value="only">Solo</option>
                  </select>
                </div>

                {/* Botón limpiar */}
                <div className="ml-auto">
                  <Button
                    onClick={resetFilters as any}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>


            {/* cuerpo */}
            {/* Lista o vacío */}
        {itemsPrepared.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia>
                <Caravan className="w-16 h-16 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No hay clientes registrados</EmptyTitle>
              <EmptyDescription>
                Aún no tienes clientes. Agrega el primero para comenzar a gestionar.
              </EmptyDescription>
            </EmptyHeader>

            <EmptyContent>
              <div className="flex justify-center">
                <ClienteDialog
                  mode="create"
                  trigger={
                    <Button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-white">
                      <Plus className="w-4 h-4" />
                      Agregar cliente
                    </Button>
                  }
                />
              </div>
            </EmptyContent>
          </Empty>
        ) :(
          <>
          {/* Grid de empleados */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            
            {itemsPrepared.map((clientItem) => (
              <Card key={clientItem.id} className="hover:shadow-lg transition-shadow">
              
              <CardHeader>
                  <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                              <User className="w-5 h-5 text-primary" />
                          </div>
                            
                          <div>
                              <CardTitle className="text-lg font-semibold">
                                  {clientItem.fullName}
                              </CardTitle>

                          </div>
                      </div>
          
                  </div>

                  </CardHeader>
          
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">
                                  {clientItem.telefono || "No especificado"}
                              </p>
                            </div>
          
                            <div className="flex items-center gap-2">
                              <BadgeCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">
                                {clientItem.activo ? "Cliente activo" : "Cliente inactivo"}
                              </p>
                            </div>
          
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <p className="text-sm text-muted-foreground">
                                      Registrado: {clientItem.createdLabel}
                                    </p>
                            </div>
                          </div>
                    </CardContent>
          
                    <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-3">
                        <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Última Actualización: {clientItem.updatedLabel}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!clientItem.deleted_at ? (
                            <>
                              {/* Botón de editar con Dialog */}
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <div>
                                          <ClienteDialog
                                              clienteData={clientItem}
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
                                          <p>Editar cliente</p>
                                      </TooltipContent>
                              </Tooltip>

          
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      
                                          <Link href={clientItem.generarPedidoUrl} className="p-2 rounded-md transition-colors hover:bg-gray-400">
                                              <Calendar className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                          </Link>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Generar Pedido Nuevo</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </>
                                  ) : (
                                    <Badge variant="default" className="bg-red-500 hover:bg-red-600">
                                      Eliminado
                                    </Badge>
                                  )}
          
                                  {clientItem.activo ? (
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
