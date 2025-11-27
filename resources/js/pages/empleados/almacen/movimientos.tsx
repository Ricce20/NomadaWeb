import { useState, useEffect } from "react";
import HeadingSmall from "@/components/heading-small";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/layouts/app-layout";
import inventario from "@/routes/sucursal/inventario";
import { BreadcrumbItem, PaginatedResponse, SucursalItem } from "@/types";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowDownCircle, ArrowUpCircle, Plus, RefreshCw, Eye, Search, X } from "lucide-react";

interface MovementItem {
  id: number;
  movement_number: string;
  warehouse_name: string;
  type: string;
  status: string;
  reason: string | null;
  performed_by_name: string;
  created_at: string;
}

interface IndexProps {
  sucursal: SucursalItem;
  movements: PaginatedResponse<MovementItem>;
  filters: {
    search?: string;
    type?: string;
    status?: string;
  };
}

export default function MovimientosInventarioEmpleado({ sucursal, movements, filters }: IndexProps) {
  const [search, setSearch] = useState(filters.search || "");
  const [type, setType] = useState(filters.type || "");
  const [status, setStatus] = useState(filters.status || "");

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Movimientos de Inventario",
      href: inventario.verMovimientosInventario().url,
    },
  ];

  // Aplicar filtros
  const applyFilters = () => {
    router.get(
      inventario.verMovimientosInventario().url,
      {
        search: search || undefined,
        type: type || undefined,
        status: status || undefined,
      },
      {
        preserveState: true,
        preserveScroll: true,
      }
    );
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearch("");
    setType("");
    setStatus("");
    router.get(inventario.verMovimientosInventario().url, {}, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  // Aplicar filtros al presionar Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };

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

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'completado':
        return 'default';
      case 'cancelado':
        return 'destructive';
      case 'pendiente':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const hasActiveFilters = search || type || status;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Movimientos de Inventario - ${sucursal.nombre}`} />
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <HeadingSmall
            title="Movimientos de Inventario"
            description="Historial de entradas, salidas y ajustes de stock"
          />
          <Button size="sm" asChild>
            <Link href={inventario.crearMovimientoInventarioEmpleado().url}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar movimiento
            </Link>
          </Button>
        </div>

        {/* Filtros */}
        <div className="rounded-lg border bg-card p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número o motivo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de movimiento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">Todos los tipos</SelectItem>
                  <SelectItem value="in">Entrada</SelectItem>
                  <SelectItem value="out">Salida</SelectItem>
                  <SelectItem value="adjust">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">Todos los estados</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {hasActiveFilters && (
                <span>Mostrando resultados filtrados</span>
              )}
            </div>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpiar filtros
                </Button>
              )}
              <Button size="sm" onClick={applyFilters}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <ArrowDownCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {movements.data.filter(m => m.type === 'in').length}
                </p>
                <p className="text-sm text-muted-foreground">Entradas</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-3">
                <ArrowUpCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {movements.data.filter(m => m.type === 'out').length}
                </p>
                <p className="text-sm text-muted-foreground">Salidas</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/10 p-3">
                <RefreshCw className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {movements.data.filter(m => m.type === 'adjust').length}
                </p>
                <p className="text-sm text-muted-foreground">Ajustes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        {movements.data.length === 0 ? (
          <Empty>
            <EmptyMedia>
              <RefreshCw className="h-12 w-12" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {hasActiveFilters ? "No se encontraron resultados" : "No hay movimientos registrados"}
              </EmptyTitle>
              <EmptyDescription>
                {hasActiveFilters 
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Comienza registrando entradas, salidas o ajustes de inventario"
                }
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpiar filtros
                </Button>
              ) : (
                <Button asChild>
                  <Link href={inventario.crearMovimientoInventarioEmpleado().url}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar movimiento
                  </Link>
                </Button>
              )}
            </EmptyContent>
          </Empty>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Movimiento</TableHead>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Almacén</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.data.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {movement.movement_number}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {movement.created_at}
                    </TableCell>
                    <TableCell>{movement.warehouse_name}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(movement.type)} className="gap-1">
                        {getTypeIcon(movement.type)}
                        {getTypeLabel(movement.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(movement.status)}>
                        {movement.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{movement.performed_by_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {movement.reason || '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/sucursal/inventario/movimiento/${movement.id}/detalles`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalles
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Paginación */}
        {movements.links && movements.links.length > 3 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {movements.data.length} de {movements.total} resultados
            </div>
            <div className="flex items-center gap-1">
              {movements.links.map((link, index) => (
                <Button
                  key={index}
                  variant={link.active ? "default" : "outline"}
                  size="sm"
                  disabled={!link.url}
                  onClick={() => {
                    if (link.url) {
                      router.get(link.url, {}, {
                        preserveState: true,
                        preserveScroll: true,
                      });
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}