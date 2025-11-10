// Pages/Sucursales/Usuarios/Index.tsx
import HeadingSmall from "@/components/heading-small";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import AppLayoutOwnership from "@/layouts/app-layout-ownership";
import SucursalPartialLayout from "@/layouts/sucursales/layout-partials";
import { BreadcrumbItem, PaginatedResponse, User, SucursalItem } from "@/types";
import { Head, router } from "@inertiajs/react";
import { debounce } from "lodash";
import { Users, User as UserIcon, Pencil, Trash, Clock, Calendar, Plus, Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import usuario from "@/routes/sucursal/usuario";

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
import { UsuarioDialog } from "@/components/user-dialog";

type TrashedFilter = "" | "with" | "only";

interface Filters {
  search?: string;
  sort?: string;
  direction?: "asc" | "desc";
  trashed?: TrashedFilter;
}

type RouterPayload = Record<string, string | number | boolean | null | undefined>;

interface IndexProps {
  items: PaginatedResponse<User>;
  filters: Filters;
  sucursal: SucursalItem;
}

export default function Usuarios({ sucursal, items, filters }: IndexProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Usuarios",
      href: usuario.index(sucursal.id).url,
    },
  ];
  const [filtersData, setFilters] = useState<Filters>(filters);

  const itemsPrepared = useMemo(() => {
    return items.data.map((user) => {
      const createdLabel = user.created_at ?? "No disponible";
      const updatedLabel = user.updated_at ?? "No disponible";

      // Mapear tipos de usuario a español
      const tipoLabel = {
        manager: "Gerente",
        warehouse_man: "Almacenista",
        driver: "Conductor",
        owner: "Propietario",
        super_admin: "Super Admin",
      }[user.type] || user.type;

      return {
        ...user,
        displayName: user.name || user.username || "Sin nombre",
        deleteUrl: usuario.delete(user.id).url,
        createdLabel,
        updatedLabel,
        tipoLabel,
      };
    });
  }, [items.data, sucursal.id]);

  const filtersToPayload = (filters: Filters): RouterPayload => {
    return {
      search: filters.search ?? "",
      sort: filters.sort ?? "name",
      direction: filters.direction ?? "asc",
      trashed: filters.trashed ?? undefined,
    };
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((filters: Filters) => {
        router.get(usuario.index(sucursal.id).url, filtersToPayload(filters), {
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
      router.get(usuario.index(sucursal.id).url, filtersToPayload(newFilters), {
        preserveState: true,
        replace: true,
      });
    }
  };

  const handleDelete = (id: number | string) => {
    router.delete(usuario.delete(id).url, {
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
      sort: "name",
      direction: "asc",
      trashed: "" as TrashedFilter,
    };
    setFilters(resetFilters);
    router.get(usuario.index(sucursal.id).url, filtersToPayload(resetFilters), {
      preserveState: true,
      replace: true,
    });
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Función para obtener el color del badge según el tipo
  const getTipoBadgeColor = (type: string) => {
    switch (type) {
      case "manager":
        return "bg-blue-500 hover:bg-blue-600";
      case "warehouse_man":
        return "bg-purple-500 hover:bg-purple-600";
      case "driver":
        return "bg-orange-500 hover:bg-orange-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <AppLayoutOwnership breadcrumbs={breadcrumbs}>
      <Head title="Usuarios" />
      <SucursalPartialLayout>
        <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
          {/* Heading */}
          <div className="flex items-center gap-4">
            <HeadingSmall
              title="Gestión de usuarios"
              description={`Administra los usuarios de ${sucursal.nombre}`}
            />

            {/* Botón para agregar usuario con Dialog */}
            <UsuarioDialog
              sucursalId={sucursal.id}
              mode="create"
              trigger={
                <Button className="ml-auto inline-flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Agregar Usuario
                </Button>
              }
            />
          </div>

          {/* Filtros y búsqueda */}
          <Card>
            <CardHeader>
              <CardTitle>Filtrar y buscar usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Búsqueda */}
                <div className="md:col-span-2">
                  <label htmlFor="search" className="block text-sm font-medium mb-2">
                    Buscar usuarios
                  </label>
                  <input
                    type="text"
                    id="search"
                    name="search"
                    value={filtersData.search ?? ""}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    placeholder="Buscar por nombre, username, email..."
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
                    value={filtersData?.sort ?? "name"}
                    onChange={(e) => handleFilterChange("sort", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="name">Nombre</option>
                    <option value="username">Username</option>
                    <option value="type">Tipo</option>
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
                  Mostrando {items.data.length} de {items.total} usuarios
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

          {/* Lista de usuarios o estado vacío */}
          {itemsPrepared.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia>
                  <Users className="w-16 h-16 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>No hay usuarios registrados</EmptyTitle>
                <EmptyDescription>
                  Aún no tienes usuarios en esta sucursal. Agrega el primero para comenzar.
                </EmptyDescription>
              </EmptyHeader>

              <EmptyContent>
                <div className="flex justify-center">
                  <UsuarioDialog
                    sucursalId={sucursal.id}
                    mode="create"
                    trigger={
                      <Button className="inline-flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Agregar Usuario
                      </Button>
                    }
                  />
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              {/* Grid de usuarios */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {itemsPrepared.map((usuarioItem) => (
                  <Card key={usuarioItem.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <UserIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold">
                              {usuarioItem.displayName}
                            </CardTitle>
                            <CardDescription>@{usuarioItem.username}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            Rol: {usuarioItem.tipoLabel}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            Registrado: {usuarioItem.createdLabel}
                          </p>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-3">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Actualizado: {usuarioItem.updatedLabel}
                      </div>
                      <div className="flex items-center gap-2">
                        {!usuarioItem.deleted_at ? (
                          <>
                            {/* Botón de editar con Dialog */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <UsuarioDialog
                                    sucursalId={sucursal.id}
                                    usuarioData={usuarioItem}
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
                                <p>Editar usuario</p>
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
                                          Esta acción eliminará al usuario{" "}
                                          <strong>{usuarioItem.displayName}</strong> de esta sucursal.
                                          Esta acción no se puede deshacer.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(usuarioItem.id)}
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
                                <p>Eliminar usuario</p>
                              </TooltipContent>
                            </Tooltip>
                          </>
                        ) : (
                          <Badge variant="default" className="bg-red-500 hover:bg-red-600">
                            Eliminado
                          </Badge>
                        )}

                        <Badge variant="default" className={getTipoBadgeColor(usuarioItem.type)}>
                          {usuarioItem.tipoLabel}
                        </Badge>
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