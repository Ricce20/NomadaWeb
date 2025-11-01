import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn, isSameUrl, resolveUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { business } from '@/routes/settings';
import { show } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';
import { CustomNavItem, SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

const sidebarNavItems: CustomNavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: null,
        type: ['owner','super_admin'], // Solo para business
    },
    {
        title: 'Password',
        href: editPassword(),
        icon: null,
        type: ['owner','super_admin'], // Múltiples tipos
    },
    {
        title: 'Two-Factor Auth',
        href: show(),
        icon: null,
        type: ['owner','super_admin'], // Business y admin
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: null,
        type: ['owner','super_admin', 'warehouse_man','manager'], // Varios tipos
    },
    {
        title: 'Acerca de mi negocio',
        href: business(),
        icon: null,
        type: 'owner', // Solo para dueños
    }
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }
    //datos del usuario logeado
    const { auth } = usePage<SharedData>().props;
    const currentPath = window.location.pathname;

     // Función para verificar si el item debe mostrarse
    const shouldShowItem = (item: CustomNavItem): boolean => {
        const userType = auth.user?.type; // Ajusta según tu estructura de user
        
        if (Array.isArray(item.type)) {
            return item.type.includes(userType as string);
        }
        
        return item.type === userType;
    };

    // Filtrar items según el tipo de usuario
    const filteredNavItems = sidebarNavItems.filter(shouldShowItem);

    return (
        <div className="px-4 py-6">
            <Heading
                title="Settings"
                description="Manage your profile and account settings"
            />

            <div className="flex flex-col lg:flex-row lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav className="flex flex-col space-y-1 space-x-0">
                        {filteredNavItems.map((item, index) => (
                            <Button
                                key={`${typeof item.href === 'string' ? item.href : item.href.url}-${index}`}
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
                                        <item.icon className="h-4 w-4" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className="flex-1 md:max-w-2xl">
                    <section className="max-w-xl space-y-12">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
