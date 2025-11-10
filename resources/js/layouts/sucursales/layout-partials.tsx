import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import almacen from '@/routes/sucursal/almacen';
import empleado from '@/routes/sucursal/empleado';
import usuario from '@/routes/sucursal/usuario';
import { view } from '@/routes/sucursales';
import { NavItem, SucursalItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Boxes, Caravan, LucideFileSpreadsheet, UserCheck2Icon, UserCog2, Warehouse } from 'lucide-react';
import { type PropsWithChildren } from 'react';

const getSidebarNavItems = (sucursalId: number): NavItem[] => [
    { title: 'Detalles', href: view(sucursalId), icon: LucideFileSpreadsheet },
    { title: 'Empleados', href: empleado.index(sucursalId), icon: UserCheck2Icon },
    { title: 'Almacenes', href: almacen.index(sucursalId).url, icon: Warehouse },
    { title: 'Productos', href: '', icon: Boxes },
    { title: 'Vehículos', href: '', icon:  Caravan},
    { title: 'Usuarios', href: usuario.index(sucursalId), icon: UserCog2 },
];

export default function SucursalPartialLayout({ children }: PropsWithChildren) {
    const currentPath = window.location.pathname;
    const { sucursal } = usePage<{ sucursal: SucursalItem }>().props;
    const sidebarNavItems = getSidebarNavItems(sucursal.id);

    return (
        <div className="flex flex-col h-full w-full p-4 space-y-6">
            <Heading
                title={sucursal.nombre}
                description="Administra la información de la sucursal"
            />

            <div className="flex flex-1 flex-col lg:flex-row lg:space-x-12 overflow-hidden">
                {/* Sidebar */}
                <aside className="lg:w-36 w-full flex-shrink-0">
                    <nav className="flex flex-col space-y-1">
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${typeof item.href === 'string' ? item.href : item.href}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-muted':
                                        currentPath ===
                                        (typeof item.href === 'string'
                                            ? item.href
                                            : item.href.url),
                                })}
                            >
                                <Link href={item.href}>
                                    {item.icon && (
                                        <item.icon className="h-4 w-4 mr-2" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                {/* Contenido principal */}
                <div className="flex-1 flex flex-col overflow-auto">
                    <section className="flex-1 w-full h-full space-y-6">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
