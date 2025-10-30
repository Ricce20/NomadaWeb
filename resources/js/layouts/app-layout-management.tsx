import AppLayoutManagementTemplate from '@/layouts/app/app-siderbar-management-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutManagementTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
    </AppLayoutManagementTemplate>
);
