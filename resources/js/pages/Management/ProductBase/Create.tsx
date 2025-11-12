import AppLayoutManagement from '@/layouts/app-layout-management';
import { Head } from '@inertiajs/react';
import management from '@/routes/management';
import ProductBaseForm from './Parts/ProductBaseForm';
import ValidationErrors from '@/components/ValidationErrors';
import FlashMessage from '@/components/FlashMessage';

export default function Create() {
  return (
    <AppLayoutManagement breadcrumbs={[{ title: 'Productos', href: management.productBases.index.url() }, { title: 'Nuevo', href: management.productBases.create.url() }]}> 
      <Head title="Nuevo producto" />
      
      <FlashMessage />
      <ValidationErrors />
      
      <div className="rounded border p-4 dark:border-neutral-700">
        <ProductBaseForm mode="create" />
      </div>
    </AppLayoutManagement>
  );
}