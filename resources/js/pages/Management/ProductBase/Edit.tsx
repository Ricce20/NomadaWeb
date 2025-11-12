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

      <FlashMessage />
      <ValidationErrors />

      {/* Banner de producto eliminado */}
      {item.deleted_at && (
        <div className="mb-4 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Este producto está eliminado. Puedes restaurarlo o eliminarlo permanentemente.
              </p>
            </div>
            <button
              onClick={handleRestore}
              className="ml-4 rounded bg-yellow-600 px-3 py-1 text-sm text-white hover:bg-yellow-700"
            >
              Restaurar
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">SKU: {item.sku_base}</div>
          <h1 className="text-xl font-semibold">{item.name}</h1>
          <div className="mt-1">{statusChip}</div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={management.productBases.index.url()} className="rounded border px-3 py-1 dark:border-neutral-600">Volver</Link>
          {!item.deleted_at && (
            <button 
              onClick={() => setDeleteModal(true)} 
              className="rounded bg-red-600 px-3 py-1 text-white dark:bg-red-500"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Tabs simples */}
      <div className="mb-4 flex gap-2">
        <button
          className={`rounded px-3 py-1 ${tab === 'general' ? 'bg-black text-white dark:bg-white dark:text-black' : 'border'}`}
          onClick={() => setTab('general')}
        >
          Datos generales
        </button>
        <button
          className={`rounded px-3 py-1 ${tab === 'images' ? 'bg-black text-white dark:bg-white dark:text-black' : 'border'}`}
          onClick={() => setTab('images')}
        >
          Imágenes
        </button>
        <button
          className={`rounded px-3 py-1 ${tab === 'pricing' ? 'bg-black text-white dark:bg-white dark:text-black' : 'border'}`}
          onClick={() => setTab('pricing')}
        >
          Precios por sucursal
        </button>
      </div>

      {tab === 'general' && (
        <div className="rounded border p-4 dark:border-neutral-700">
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
        <div className="rounded border p-4 dark:border-neutral-700">
          {ImageUploaderComp ? (
            <ImageUploaderComp productId={item.id} images={item.images || []} />
          ) : (
            <div className="text-sm text-muted-foreground">ImageUploader no disponible todavía. Placeholder.</div>
          )}
        </div>
      )}

      {tab === 'pricing' && (
        <div className="rounded border p-4 dark:border-neutral-700">
          {PricingTableComp ? (
            <PricingTableComp productId={item.id} initialRows={item.branches || []} />
          ) : (
            <div className="text-sm text-muted-foreground">PricingTable no disponible todavía. Placeholder.</div>
          )}
        </div>
      )}

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