//imports
import HeadingSmall from "@/components/heading-small";
import { TarjetNumeric } from "@/components/tarject-numeric";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
  
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import AppLayoutOwnership from "@/layouts/app-layout-ownership";
import { create, edit, index } from "@/routes/sucursales";
import { BreadcrumbItem, Horarios, SucursalItem } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { Plus, Store, MapPin, Phone, Clock, Mail, Pencil } from "lucide-react";
import { Tooltip } from "@radix-ui/react-tooltip";
import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

//breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Sucursales',
    href: index().url,
  },
];


function formatearHorarios(horarios: Horarios | null): string {
  if (!horarios) return "No disponible";

  const diasOrden = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const diasAbreviados: Record<string, string> = {
    lunes: 'Lun',
    martes: 'Mar',
    miercoles: 'Mié',
    jueves: 'Jue',
    viernes: 'Vie',
    sabado: 'Sáb',
    domingo: 'Dom'
  };

  // Agrupar días con el mismo horario
  const grupos: Array<{ dias: string[], horario: string }> = [];
  
  diasOrden.forEach(dia => {
    const horarioDia = horarios[dia as keyof Horarios];
    if (!horarioDia) return;

    const horarioTexto = horarioDia.cerrado 
      ? 'Cerrado'
      : `${horarioDia.hora_apertura} - ${horarioDia.hora_cierre}`;

    const grupoExistente = grupos.find(g => g.horario === horarioTexto);
    
    if (grupoExistente) {
      grupoExistente.dias.push(diasAbreviados[dia]);
    } else {
      grupos.push({ dias: [diasAbreviados[dia]], horario: horarioTexto });
    }
  });

  // Formatear salida
  return grupos.map(grupo => {
    const diasTexto = grupo.dias.length > 1 
      ? `${grupo.dias[0]} - ${grupo.dias[grupo.dias.length - 1]}`
      : grupo.dias[0];
    return `${diasTexto}: ${grupo.horario}`;
  }).join(' | ');
}


//main component
export default function Sucursales({
  totalSucursales,
  sucursalesActivas,
  sucursalesInactivas,
  sucursalesData
}: {
  totalSucursales: number;
  sucursalesActivas: number;
  sucursalesInactivas: number;
  sucursalesData?: SucursalItem[];
}) {
  const lista = sucursalesData || [];
  
  return (
    <AppLayoutOwnership breadcrumbs={breadcrumbs}>
      <Head title="Sucursales" />
      
      {/* Contenido  */}
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* Heading */}
        <div className="flex items-center gap-4">
          <HeadingSmall
            title="Gestión de Sucursales"
            description="Aquí puedes administrar las sucursales de tu negocio"
          />

          <Link
            href={create().url}
            className="ml-auto inline-flex items-center gap-2 rounded bg-foreground px-4 py-2 text-background hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar Sucursal
          </Link>
        </div>

        {/* Datos generales de sucursales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <TarjetNumeric
            titulo="Total de Sucursales"
            value={totalSucursales}
            color="primary"
          />
          
          <TarjetNumeric
            titulo="Sucursales Activas"
            value={sucursalesActivas}
            color="green-500"
          />
          
          <TarjetNumeric
            titulo="Sucursales Inactivas"
            value={sucursalesInactivas}
            color="destructive"
          />
        </div>

        {/* Lista de sucursales o estado vacío */}
        {lista.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia>
                <Store className="w-16 h-16 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No hay sucursales registradas</EmptyTitle>
              <EmptyDescription>
                Aún no tienes sucursales. Crea la primera para comenzar a gestionar.
              </EmptyDescription>
            </EmptyHeader>

            <EmptyContent>
              <div className="flex justify-center">
                <Link
                  href={create().url}
                  className="inline-flex items-center gap-2 rounded bg-foreground px-4 py-2 text-background hover:bg-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Sucursal
                </Link>
              </div>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lista.map((sucursal) => (

              <Card key={sucursal.id} className="hover:shadow-lg transition-shadow">

                <CardHeader>

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {sucursal.nombre}
                        </CardTitle>
                      </div>
                    </div>

                    <CardAction>
                       <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                 <Link
                                    href={edit(sucursal.id).url}
                                    className="p-2 rounded-md  transition-colors hover:bg-gray-400"
                                    title="Editar sucursal"
                                    >
                                    <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Editar sucursal</p>
                            </TooltipContent>
                        </Tooltip>
                       
                        {sucursal.activo ? (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            Activa
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Inactiva
                          </Badge>
                        )}
                      </div>
                    </CardAction>

                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Dirección */}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        {sucursal.direccion_completa ?? "No especificada"}
                      </p>
                    </div>

                    {/* Teléfono */}
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        {sucursal.telefono ?? "No especificado"}
                      </p>
                    </div>

                    {/* Código Postal */}
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        C.P. {sucursal.codigo_postal ?? "-"}
                      </p>
                    </div>

                    {/* Horarios */}
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        {formatearHorarios(sucursal.horarios)}
                      </p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="text-xs text-muted-foreground border-t pt-3">
                  <Clock className="w-3 h-3 mr-1" />
                  Última Actualización: {sucursal.updated_at 
                    ? new Date(sucursal.updated_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'No disponible'}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayoutOwnership>
  );
}