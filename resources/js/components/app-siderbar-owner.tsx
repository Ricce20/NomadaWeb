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
import { ownership } from '@/routes';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, UserCheckIcon } from 'lucide-react';
import AppLogo from './app-logo';
import { index } from '@/routes/sucursales';
import cliente from '@/routes/sucursal/cliente';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard Owner',
        href: ownership().url,
        icon: LayoutGrid,
    },
    {
        title: 'Sucursales',
        href: index().url,
        icon: Folder,
    },
    {
        title: 'Clientes',
        href: cliente.index().url,
        icon: UserCheckIcon,
    },
   
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

export function AppSidebarOwner() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const negocioCount = user.negocio_count;
    const tieneNegocios = negocioCount as number > 0;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={ownership().url} prefetch> {/* Agregado .url */}
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            
            {tieneNegocios && ( // Condición corregida
                <SidebarContent>
                    <NavMain items={mainNavItems} />
                </SidebarContent>
            )}

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}