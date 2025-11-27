import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Package, ClipboardList, History, LucidePersonStanding, Warehouse } from 'lucide-react';
import AppLogo from './app-logo';
import cliente from '@/routes/sucursal/cliente';
import sucursal from '@/routes/sucursal';


// Definir items con sus roles permitidos
interface NavItemWithRoles extends NavItem {
    allowedRoles?: string[]; // Si está vacío o undefined, se muestra a todos
}

const mainNavItems: NavItemWithRoles[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        allowedRoles: [], // Todos pueden ver
    },
    {
        title: 'Clientes',
        href: cliente.negocio.index().url,
        icon: LucidePersonStanding,
        allowedRoles: ['manager'], // Solo manager
    },
    {
        title: 'Gestión almacenes',
        href: sucursal.almacen.gestion(),
        icon: Warehouse,
        allowedRoles: [], // Todos pueden ver
    },
    {
        title: 'Movimientos de Inventario',
        href: sucursal.inventario.verMovimientosInventario().url,
        icon: ClipboardList,
        allowedRoles: ['warehouse_man'], // Solo warehouse_manager
    },
    {
        title: 'Pedidos',
        href: sucursal.pedido.panel().url,
        icon: Package,
        allowedRoles: ['manager'], // Solo manager
    },
    {
        title: 'Historial de Pedidos',
        href: sucursal.pedido.historial(),
        icon: History,
        allowedRoles: ['manager'], // Solo manager
    }
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const userType = auth.user.type;

    // Filtrar items según el tipo de usuario
    const filteredNavItems = mainNavItems.filter(item => {
        // Si no tiene roles definidos o el array está vacío, mostrar a todos
        if (!item.allowedRoles || item.allowedRoles.length === 0) {
            return true;
        }
        // Si tiene roles definidos, verificar si el usuario tiene el rol
        return userType && item.allowedRoles.includes(userType);
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}