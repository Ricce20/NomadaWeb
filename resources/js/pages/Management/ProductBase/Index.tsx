import AppLayoutManagement from '@/layouts/app-layout-management';
import { Head, Link, router } from '@inertiajs/react';
import management from '@/routes/management';
import { useEffect, useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import FlashMessage from '@/components/FlashMessage';

interface Brand { id: number; name: string }
interface Category { id: number; name: string }
interface Unit { id: number; name: string }
interface Item {
  id: number;
  sku_base: string;
  name: string;
  is_active: boolean;
  brand?: Brand;
  category?: Category;
  uom?: Unit;
}

interface Props {
  items: {
    data: Item[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: { search?: string };
}

export default function Index({ items, filters }: Props) {
  const [search, setSearch] = useState(filters?.search ?? '');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; item: Item | null }>({
    isOpen: false,
    item: null,
  });

  // keep URL query in sync after small debounce
  useEffect(() => {
    // Solo navegar si el search cambió respecto al filtro actual
    if (search === (filters?.search ?? '')) {
      return; // No hacer nada si es igual
    }

    const t = setTimeout(() => {
      router.get(
        management.productBases.index.url({ query: { search } }),
        { replace: true, preserveState: true }
      );
    }, 300);
    return () => clearTimeout(t);
  }, [search]); // filters.search NO debe estar en dependencias

  const handleDelete = () => {
    if (!deleteModal.item) return;
    router.delete(management.productBases.destroy.url(deleteModal.item.id));
  };

  return (
    <AppLayoutManagement breadcrumbs={[{ title: 'Productos', href: management.productBases.index.url() }]}>
      <Head title="Productos" />
      
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <FlashMessage />

        {/* Header con búsqueda y botón */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o SKU..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <Link
            href={management.productBases.create.url()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto
          </Link>
        </div>

        {/* Tabla de productos */}
        <div className="rounded-md border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">SKU</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nombre</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Marca</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Categoría</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">UoM</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <svg className="mb-2 h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm">No se encontraron productos</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.data.map((it) => (
                    <tr key={it.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">
                        <span className="font-mono text-xs">{it.sku_base}</span>
                      </td>
                      <td className="p-4 align-middle font-medium">{it.name}</td>
                      <td className="p-4 align-middle text-muted-foreground">{it.brand?.name ?? '-'}</td>
                      <td className="p-4 align-middle text-muted-foreground">{it.category?.name ?? '-'}</td>
                      <td className="p-4 align-middle text-muted-foreground">{it.uom?.name ?? '-'}</td>
                      <td className="p-4 align-middle">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            it.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}
                        >
                          {it.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <Link
                            href={management.productBases.edit.url(it.id)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, item: it })}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium text-destructive underline-offset-4 hover:underline"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {items.last_page > 1 && (
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              Mostrando <span className="font-medium">{items.data.length}</span> de{' '}
              <span className="font-medium">{items.total}</span> productos
            </div>
            <div className="flex items-center gap-1">
              {items.links.map((link, index) => (
                <Link
                  key={index}
                  href={link.url || '#'}
                  preserveState
                  className={`inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${
                    link.active
                      ? 'bg-primary text-primary-foreground shadow'
                      : link.url
                      ? 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                      : 'pointer-events-none opacity-50'
                  }`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null })}
        onConfirm={handleDelete}
        title="Eliminar producto"
        message={`¿Estás seguro de eliminar "${deleteModal.item?.name}"? Esta acción se puede revertir.`}
        confirmText="Eliminar"
        variant="danger"
      />
    </AppLayoutManagement>
  );
}