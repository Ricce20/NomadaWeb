import AppLayoutManagement from '@/layouts/app-layout-management';
import { Head, Link, router, usePage } from '@inertiajs/react';
import management from '@/routes/management';
import { useEffect, useMemo, useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import ValidationErrors from '@/components/ValidationErrors';
import FlashMessage from '@/components/FlashMessage';

type BranchPivot = {
  id?: number;
  branch_id?: number;
  price?: number;
  cost?: number | null;
  tax_rate?: number | null;
  status?: 'listed' | 'hidden' | 'archived';
  min_stock?: number | null;
  max_stock?: number | null;
  reorder_point?: number | null;
  barcode_override?: string | null;
  note?: string | null;
};

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
  branches?: Array<{ id: number; name?: string; pivot?: BranchPivot }>;
};

interface PageProps {
  item: Item;
}

// Optional dynamic parts loading to avoid crashes if missing
// soportar ambas ubicaciones de carpeta por discrepancia Pages/pages
const parts = import.meta.glob(['./Parts/*.tsx', '../../../Pages/Management/ProductBase/Parts/*.tsx']);

export default function Edit({ item }: PageProps) {
  const [ProductBaseFormComp, setProductBaseFormComp] = useState<any>(null);
  const [ImageUploaderComp, setImageUploaderComp] = useState<any>(null);
  const [PricingTableComp, setPricingTableComp] = useState<any>(null);
  const [tab, setTab] = useState<'general' | 'images' | 'pricing'>('general');
  const [deleteModal, setDeleteModal] = useState(false);
  const { props } = usePage();

  useEffect(() => {
    // Load ProductBaseForm if available
    if (parts['./Parts/ProductBaseForm.tsx']) {
      parts['./Parts/ProductBaseForm.tsx']().then((m: any) => {
        setProductBaseFormComp(m.default || m.ProductBaseForm || null);
      });
    }
    // Load ImageUploader if available
    if (parts['./Parts/ImageUploader.tsx']) {
      parts['./Parts/ImageUploader.tsx']().then((m: any) => {
        setImageUploaderComp(m.default || m.ImageUploader || null);
      });
    }
    // Load PricingTable if available
    if (parts['./Parts/PricingTable.tsx']) {
      parts['./Parts/PricingTable.tsx']().then((m: any) => {
        setPricingTableComp(m.default || m.PricingTable || null);
      });
    }
  }, []);

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

  const handleDelete = () => {
    router.delete(management.productBases.destroy.url(item.id), {
      onSuccess: () => {
        router.visit(management.productBases.index.url());
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
    <AppLayoutManagement breadcrumbs={[{ title: 'Productos', href: management.productBases.index.url() }, { title: item.name, href: management.productBases.edit.url(item.id) }]}> 
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

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-1">
            <button
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-t-md px-4 py-2 text-sm font-medium transition-all ${
                tab === 'general' 
                  ? 'border-b-2 border-primary bg-background text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setTab('general')}
            >
              Datos generales
            </button>
            <button
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-t-md px-4 py-2 text-sm font-medium transition-all ${
                tab === 'images' 
                  ? 'border-b-2 border-primary bg-background text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setTab('images')}
            >
              Imágenes
            </button>
            <button
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-t-md px-4 py-2 text-sm font-medium transition-all ${
                tab === 'pricing' 
                  ? 'border-b-2 border-primary bg-background text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setTab('pricing')}
            >
              Precios por sucursal
            </button>
          </div>
        </div>

        {tab === 'general' && (
          <div className="rounded-md border bg-card p-6">
          {ProductBaseFormComp ? (
            <ProductBaseFormComp
              mode="edit"
              initialValues={item}
              onSubmit={(payload: any) =>
                router.put(management.productBases.update.url(item.id), payload)
              }
            />
          ) : (
            <div className="text-sm text-muted-foreground">ProductBaseForm no disponible todavía. Placeholder.</div>
          )}
        </div>
      )}

        {tab === 'images' && (
          <div className="rounded-md border bg-card p-6">
            {ImageUploaderComp ? (
              <ImageUploaderComp productId={item.id} images={item.images || []} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <svg className="mb-2 h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">ImageUploader no disponible todavía</p>
              </div>
            )}
          </div>
        )}

        {tab === 'pricing' && (
          <div className="rounded-md border bg-card p-6">
            {PricingTableComp ? (
              <PricingTableComp productId={item.id} initialRows={item.branches || []} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <svg className="mb-2 h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">PricingTable no disponible todavía</p>
              </div>
            )}
          </div>
        )}
      </div>

        <ConfirmModal
          isOpen={deleteModal}
          onClose={() => setDeleteModal(false)}
          onConfirm={handleDelete}
          title="Eliminar producto"
          message={`¿Estás seguro de eliminar "${item.name}"? Esta acción se puede revertir.`}
          confirmText="Eliminar"
          variant="danger"
        />
      </AppLayoutManagement>
    );
  }