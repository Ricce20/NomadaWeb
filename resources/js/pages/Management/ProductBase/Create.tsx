import AppLayoutManagement from '@/layouts/app-layout-management';
import { Head, usePage } from '@inertiajs/react';
import management from '@/routes/management';
import ProductBaseForm from './Parts/ProductBaseForm';
import ValidationErrors from '@/components/ValidationErrors';
import FlashMessage from '@/components/FlashMessage';

interface Catalogs {
  brands: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  uoms: Array<{ id: number; name: string; abbreviation: string }>;
}

interface PageProps {
  mode: 'create';
  catalogs: Catalogs;
}

export default function Create() {
  const { props } = usePage<any>();
  const { mode = 'create', catalogs } = props as PageProps;

  return (
    <AppLayoutManagement breadcrumbs={[
      { title: 'Productos', href: management.productBases.index.url() }, 
      { title: 'Nuevo', href: management.productBases.create.url() }
    ]}> 
      <Head title="Nuevo producto" />
      
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <FlashMessage />
        <ValidationErrors />
        
        <div className="rounded-md border bg-card p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Crear Producto Base</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Agrega un nuevo producto al catálogo global
            </p>
          </div>
          <ProductBaseForm mode={mode} catalogs={catalogs} />
        </div>
      </div>
    </AppLayoutManagement>
  );
}