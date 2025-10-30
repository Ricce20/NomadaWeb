import { Head } from '@inertiajs/react';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/app-layout';
import AppLayoutOwner from '@/layouts/app-layout-ownership';
import AppLayoutManagement from '@/layouts/app-layout-management';
import SettingsLayout from '@/layouts/settings/layout';
import { edit as editAppearance } from '@/routes/appearance';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Appearance settings',
        href: editAppearance().url,
    },
];

export default function Appearance() {
    const { auth } = usePage<SharedData>().props;
    
    // El tipo de usuario está definido en auth.user.type
    const userType = auth.user.type;
    
    // Seleccionar el layout basado en el tipo de usuario
    let Layout;
    if (['owner', 'super_admin'].includes(userType)) {
        Layout = AppLayoutOwner;
    } else if (['manager', 'warehouse_man'].includes(userType)) {
        Layout = AppLayoutManagement;
    } else {
        Layout = AppLayout; // Para 'driver' y cualquier otro tipo
    }

    return (
        <Layout breadcrumbs={breadcrumbs}>
            <Head title="Appearance settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Appearance settings"
                        description="Update your account's appearance settings"
                    />
                    <AppearanceTabs />
                </div>
            </SettingsLayout>
        </Layout>
    );
}
