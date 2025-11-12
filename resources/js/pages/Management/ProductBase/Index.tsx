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
    const t = setTimeout(() => {
      router.get(
        management.productBases.index.url({ query: { search } }),
        { replace: true, preserveState: true }
      );
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = () => {
    if (!deleteModal.item) return;
    router.delete(management.productBases.destroy.url(deleteModal.item.id));
  };

  return (
    <AppLayoutManagement breadcrumbs={[{ title: 'Productos', href: management.productBases.index.url() }]}>
      <Head title="Productos" />
      
      <FlashMessage />

      <div className="flex items-center justify-between mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o SKU"
          className="border rounded px-3 py-2 w-full max-w-md dark:bg-neutral-800 dark:border-neutral-600"
        />
        <Link
          href={management.productBases.create.url()}
          className="ml-4 inline-flex items-center rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
        >
          Nuevo
        </Link>
      </div>

      <div className="overflow-x-auto border rounded dark:border-neutral-700">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left">SKU</th>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Marca</th>
              <th className="p-2 text-left">Categoría</th>
              <th className="p-2 text-left">UoM</th>
              <th className="p-2 text-left">Activo</th>
              <th className="p-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.data.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-500">
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              items.data.map((it) => (
                <tr key={it.id} className="border-t dark:border-neutral-700">
                  <td className="p-2">{it.sku_base}</td>
                  <td className="p-2">{it.name}</td>
                  <td className="p-2">{it.brand?.name ?? '-'}</td>
                  <td className="p-2">{it.category?.name ?? '-'}</td>
                  <td className="p-2">{it.uom?.name ?? '-'}</td>
                  <td className="p-2">
                    <span
                      className={`inline-flex items-center rounded px-2 py-1 text-xs ${
                        it.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                      }`}
                    >
                      {it.is_active ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Link
                        href={management.productBases.edit.url(it.id)}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, item: it })}
                        className="text-red-600 hover:underline dark:text-red-400"
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

      {/* Paginación */}
      {items.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Mostrando {items.data.length} de {items.total} productos
          </div>
          <div className="flex gap-1">
            {items.links.map((link, index) => (
              <Link
                key={index}
                href={link.url || '#'}
                preserveState
                className={`px-3 py-1 rounded text-sm ${
                  link.active
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : link.url
                    ? 'border hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800'
                    : 'text-neutral-400 cursor-not-allowed'
                }`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        </div>
      )}

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