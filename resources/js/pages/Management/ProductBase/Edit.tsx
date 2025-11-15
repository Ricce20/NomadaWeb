import AppLayoutManagement from '@/layouts/app-layout-management';
import { Head, Link, router, usePage } from '@inertiajs/react';
import management from '@/routes/management';
import { useMemo, useState } from 'react';
import ConfirmWithPasswordModal from '@/components/ConfirmWithPasswordModal';
import ValidationErrors from '@/components/ValidationErrors';
import FlashMessage from '@/components/FlashMessage';
import ProductBaseForm from './Parts/ProductBaseForm';

type Item = {
  id: number;
  sku_base: string;
  name: string;
  is_active: boolean;
  deleted_at?: string | null;
  brand?: { id: number; name: string } | null;
  category?: { id: number; name: string } | null;
  uom?: { id: number; name: string } | null;
  barcodes?: Array<{ id: number; barcode: string }>;
  images?: Array<{ id: number; path: string; is_primary?: boolean; sort_order?: number }>;
  tax_code?: string;
  specs_json?: Record<string, string> | null;
};

interface Catalogs {
  brands: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  uoms: Array<{ id: number; name: string; abbreviation: string }>;
}

interface PageProps {
  mode: 'edit';
  item: Item;
  catalogs: Catalogs;
}

export default function Edit() {
  const { props } = usePage<any>();
  const { mode = 'edit', item, catalogs } = props as PageProps;
  
  const [deleteModal, setDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const passwordError = props.errors?.password;

  const statusChip = useMemo(() => (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-xs ${
        item.is_active
          ? 'bg-green-600 text-white dark:bg-green-500'
          : 'bg-red-600 text-white dark:bg-red-500'
      }`}
    >
      {item.is_active ? 'Activo' : 'Inactivo'}
    </span>
  ), [item.is_active]);

  const handleDelete = (password: string) => {
    setIsDeleting(true);
    router.delete(management.productBases.destroy.url(item.id), {
      data: { password },
      preserveScroll: true,
      onSuccess: () => {
        router.visit(management.productBases.index.url());
      },
      onFinish: () => {
        setIsDeleting(false);
      },
    });
  };

  const handleRestore = () => {
    router.post(`/management/product-bases/${item.id}/restore`, {}, {
      onSuccess: () => {
        router.reload();
      },
    });
  };

  return (
    <AppLayoutManagement breadcrumbs={[
      { title: 'Productos', href: management.productBases.index.url() }, 
      { title: item.name, href: management.productBases.edit.url(item.id) }
    ]}> 
      <Head title={`Editar: ${item.name}`} />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <FlashMessage />
        <ValidationErrors />

        {/* Banner de producto eliminado */}
        {item.deleted_at && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Este producto está eliminado. Puedes restaurarlo o eliminarlo permanentemente.
                </p>
              </div>
              <button
                onClick={handleRestore}
                className="inline-flex items-center justify-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-700"
              >
                Restaurar
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">SKU: {item.sku_base}</span>
              {statusChip}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{item.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href={management.productBases.index.url()} 
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Volver
            </Link>
            {!item.deleted_at && (
              <button 
                onClick={() => setDeleteModal(true)} 
                className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground ring-offset-background transition-colors hover:bg-destructive/90"
              >
                Eliminar
              </button>
            )}
          </div>
        </div>

        {/* Formulario */}
        <div className="rounded-md border bg-card p-6">
          <ProductBaseForm 
            mode={mode} 
            initialValues={item} 
            catalogs={catalogs}
          />
        </div>
      </div>

      <ConfirmWithPasswordModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Eliminar producto del catálogo"
        message={`¿Seguro que deseas eliminar "${item.name}" del catálogo global? Esta acción solo puede realizarla un super_admin.`}
        confirmText="Eliminar"
        error={passwordError}
        isLoading={isDeleting}
      />
    </AppLayoutManagement>
  );
}
