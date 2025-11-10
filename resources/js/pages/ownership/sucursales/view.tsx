// Pages/Sucursales/DetalleNegocio.tsx
import AppLayoutOwnership from "@/layouts/app-layout-ownership";
import SucursalPartialLayout from "@/layouts/sucursales/layout-partials";
import { BreadcrumbItem, Horarios, SucursalItem } from "@/types";
import { Head } from "@inertiajs/react";
import { Building2, MapPin, Phone, Clock, Calendar, MapPinned } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Detalles del negocio',
        href: '/'
    }
];

interface Props {
    sucursal: SucursalItem;
}

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

export default function DetalleNegocio({ sucursal }: Props) {
    return (
        <AppLayoutOwnership breadcrumbs={breadcrumbs}>
            <Head title={`Detalles de ${sucursal.nombre || 'Sucursal'}`} />
            <SucursalPartialLayout>
                <div className="space-y-8">
                    {/* Header Section */}
                    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-8 border border-border">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Building2 className="w-8 h-8 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-foreground mb-2">
                                    {sucursal.nombre}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    ID: {sucursal.id}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Ubicación Card */}
                        {sucursal.direccion_completa && (
                            <div className="group bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <MapPin className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold text-foreground mb-1">
                                            Ubicación
                                        </h3>
                                        <p className="text-sm text-muted-foreground break-words">
                                            {sucursal.direccion_completa}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Código Postal Card */}
                        {sucursal.codigo_postal && (
                            <div className="group bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <MapPinned className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-foreground mb-1">
                                            Código Postal
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {sucursal.codigo_postal}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Teléfono Card */}
                        {sucursal.telefono && (
                            <div className="group bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <Phone className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-foreground mb-1">
                                            Teléfono
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {sucursal.telefono}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Horarios Card */}
                        {sucursal.horarios && (
                            <div className="group bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <Clock className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-foreground mb-3">
                                            Horarios de Atención
                                        </h3>
                                        <div className="space-y-2">
                                           <div className="flex items-start gap-2">
                                                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-muted-foreground">
                                                    {formatearHorarios(sucursal.horarios)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Última Actualización Card */}
                        <div className="group bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                    <Calendar className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-foreground mb-1">
                                        Última Actualización
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(sucursal.updated_at).toLocaleDateString('es-MX', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center justify-between bg-card rounded-xl p-6 border border-border">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground mb-1">
                                Estado de la Sucursal
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Estado operacional actual
                            </p>
                        </div>
                        <span className={`
                            inline-flex items-center px-4 py-2 rounded-full text-sm font-medium
                            ${sucursal.activo 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }
                        `}>
                            {sucursal.activo ? '● Activa' : '● Inactiva'}
                        </span>
                    </div>


                </div>
            </SucursalPartialLayout>
        </AppLayoutOwnership>
    );
}