import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import almacen from '@/routes/sucursal/almacen';
import empleado from '@/routes/sucursal/empleado';
import usuario from '@/routes/sucursal/usuario';
import productos from '@/routes/sucursales/productos';
import vehiculo from '@/routes/sucursal/vehiculo';
import { view } from '@/routes/sucursales';
import { NavItem, SucursalItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Boxes, Caravan, LucideFileSpreadsheet, UserCheck2Icon, UserCog2, Warehouse, PackageSearch } from 'lucide-react';
import { type PropsWithChildren } from 'react';

/**
 * Define los items del menú con sus roles permitidos
 */
interface NavItemWithRoles extends NavItem {
    allowedRoles?: string[]; // Si no se define, se muestra para todos
}

/**
 * Obtiene los items del menú lateral según el rol del usuario
 */
const getSidebarNavItems = (sucursalId: number, userType?: string): NavItem[] => {
    // Definir todos los items con sus roles permitidos
    const allItems: NavItemWithRoles[] = [
        { 
            title: 'Detalles', 
            href: view(sucursalId), 
            icon: LucideFileSpreadsheet,
            allowedRoles: ['owner', 'super_admin', 'manager']
        },
        { 
            title: 'Empleados', 
            href: empleado.index(sucursalId), 
            icon: UserCheck2Icon,
            allowedRoles: ['owner', 'super_admin', 'manager']
        },
        { 
            title: 'Almacenes', 
            href: almacen.index(sucursalId).url, 
            icon: Warehouse,
            allowedRoles: ['owner', 'super_admin', 'manager']
        },
        { 
            title: 'Productos', 
            href: productos.index(sucursalId).url, 
            icon: Boxes,
            allowedRoles: ['owner', 'super_admin', 'manager', 'warehouse_man']
        },
        { 
            title: 'Inventario', 
            href: `/sucursales/${sucursalId}/inventario`, 
            icon: PackageSearch,
            allowedRoles: ['owner', 'super_admin', 'manager', 'warehouse_man']
        },
        { 
            title: 'Movimientos', 
            href: `/sucursales/${sucursalId}/movimientos-inventario`, 
            icon: PackageSearch,
            allowedRoles: ['owner', 'super_admin', 'manager', 'warehouse_man']
        },
        { 
            title: 'Vehículos', 
            href: vehiculo.index(sucursalId).url, 
            icon: Caravan,
            allowedRoles: ['owner', 'super_admin', 'manager']
        },
        { 
            title: 'Usuarios', 
            href: usuario.index(sucursalId), 
            icon: UserCog2,
            allowedRoles: ['owner', 'super_admin', 'manager']
        },
    ];

    // Filtrar items según el rol del usuario
    if (!userType) {
        // Si no hay usuario, mostrar todos (fallback)
        return allItems;
    }

    return allItems.filter(item => {
        // Si no tiene roles definidos, mostrar para todos
        if (!item.allowedRoles || item.allowedRoles.length === 0) {
            return true;
        }
        // Verificar si el rol del usuario está en los roles permitidos
        return item.allowedRoles.includes(userType);
    });
};

export default function SucursalPartialLayout({ children }: PropsWithChildren) {
    const currentPath = window.location.pathname;
    const { sucursal, auth } = usePage<{ sucursal: SucursalItem; auth: { user: any } }>().props;
    const userType = auth?.user?.type;
    const sidebarNavItems = getSidebarNavItems(sucursal.id, userType);

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
