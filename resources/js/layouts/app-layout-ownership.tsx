import AppLayoutOwnerTemplate from '@/layouts/app/app-siderbar-owner-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutOwnerTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
    </AppLayoutOwnerTemplate>
);
