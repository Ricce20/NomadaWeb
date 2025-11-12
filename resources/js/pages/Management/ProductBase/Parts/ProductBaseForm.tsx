import { FormEvent, useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import management from '@/routes/management';

type Mode = 'create' | 'edit';

interface KV { key: string; value: string }

interface InitialValues {
  id: number;
  sku_base?: string;
  name?: string;
  is_active?: boolean;
  brand?: { id: number } | null;
  category?: { id: number } | null;
  uom?: { id: number } | null;
  tax_code?: string;
  barcodes?: Array<{ barcode: string }>; // optional
  specs_json?: Record<string, string> | null;
}

export default function ProductBaseForm({ mode, initialValues, onSubmit }: { mode: Mode; initialValues?: InitialValues; onSubmit?: (payload: any) => void }) {
  const [sku_base, setSku] = useState(initialValues?.sku_base ?? '');
  const [name, setName] = useState(initialValues?.name ?? '');
  const [brand_id, setBrand] = useState<number | ''>(initialValues?.brand?.id ?? '');
  const [category_id, setCategory] = useState<number | ''>(initialValues?.category?.id ?? '');
  const [uom_id, setUom] = useState<number | ''>(initialValues?.uom?.id ?? '');
  const [tax_code, setTaxCode] = useState(initialValues?.tax_code ?? '');
  const [is_active, setActive] = useState(initialValues?.is_active ?? true);
  const [specs, setSpecs] = useState<KV[]>(() => {
    if (initialValues?.specs_json) {
      return Object.entries(initialValues.specs_json).map(([key, value]) => ({ key, value: String(value) }));
    }
    return [{ key: '', value: '' }];
  });
  const [barcodes, setBarcodes] = useState<string[]>(() => {
    return (initialValues?.barcodes?.map(b => b.barcode) ?? ['']);
  });

  useEffect(() => {
    // If initialValues change, sync minimal fields (rare for edit)
    if (initialValues) {
      setSku(initialValues.sku_base ?? '');
      setName(initialValues.name ?? '');
      setActive(initialValues.is_active ?? true);
      setBrand(initialValues.brand?.id ?? '');
      setCategory(initialValues.category?.id ?? '');
      setUom(initialValues.uom?.id ?? '');
      setTaxCode(initialValues.tax_code ?? '');
      setBarcodes(initialValues.barcodes?.map(b => b.barcode) ?? ['']);
      if (initialValues.specs_json) {
        setSpecs(Object.entries(initialValues.specs_json).map(([key, value]) => ({ key, value: String(value) })));
      }
    }
  }, [initialValues]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const specs_json = Object.fromEntries(
      specs
        .filter((s) => s.key.trim() !== '')
        .map((s) => [s.key, s.value])
    );

    const payload = {
      sku_base,
      name,
      brand_id: brand_id === '' ? null : brand_id,
      category_id: category_id === '' ? null : category_id,
      uom_id: uom_id === '' ? null : uom_id,
      tax_code,
      is_active,
      specs_json,
      barcodes: barcodes.filter((b) => b && b.trim() !== ''),
    };

    if (onSubmit) {
      onSubmit(payload);
      return;
    }

    if (mode === 'edit' && initialValues?.id) {
      router.put(management.productBases.update.url(initialValues.id), payload);
    } else {
      router.post(management.productBases.store.url(), payload, {
        onSuccess: () => {
          // flash handled globally
        },
      });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm">SKU Base</label>
          <input className="mt-1 w-full border rounded px-3 py-2" value={sku_base} onChange={(e) => setSku(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Nombre</label>
          <input className="mt-1 w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Marca ID</label>
          <input type="number" className="mt-1 w-full border rounded px-3 py-2" value={brand_id as number | ''} onChange={(e) => setBrand(e.target.value ? Number(e.target.value) : '')} />
        </div>
        <div>
          <label className="block text-sm">Categoría ID</label>
          <input type="number" className="mt-1 w-full border rounded px-3 py-2" value={category_id as number | ''} onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : '')} />
        </div>
        <div>
          <label className="block text-sm">UoM ID</label>
          <input type="number" className="mt-1 w-full border rounded px-3 py-2" value={uom_id as number | ''} onChange={(e) => setUom(e.target.value ? Number(e.target.value) : '')} />
        </div>
        <div>
          <label className="block text-sm">Tax Code</label>
          <input className="mt-1 w-full border rounded px-3 py-2" value={tax_code} onChange={(e) => setTaxCode(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <input id="active" type="checkbox" checked={is_active} onChange={(e) => setActive(e.target.checked)} />
          <label htmlFor="active">Activo</label>
        </div>
      </div>

      <div>
        <label className="block text-sm mb-2">Especificaciones (clave/valor)</label>
        {specs.map((kv, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input
              placeholder="Clave"
              className="border rounded px-2 py-1 w-1/3"
              value={kv.key}
              onChange={(e) => {
                const next = [...specs];
                next[idx] = { ...kv, key: e.target.value };
                setSpecs(next);
              }}
            />
            <input
              placeholder="Valor"
              className="border rounded px-2 py-1 flex-1"
              value={kv.value}
              onChange={(e) => {
                const next = [...specs];
                next[idx] = { ...kv, value: e.target.value };
                setSpecs(next);
              }}
            />
            <button type="button" className="px-2" onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}>Eliminar</button>
          </div>
        ))}
        <button type="button" className="mt-1 rounded bg-neutral-200 px-2 py-1" onClick={() => setSpecs([...specs, { key: '', value: '' }])}>Añadir</button>
      </div>

      <div>
        <label className="block text-sm mb-2">Barcodes</label>
        {barcodes.map((bc, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input
              placeholder="Código de barras"
              className="border rounded px-2 py-1 flex-1"
              value={bc}
              onChange={(e) => {
                const next = [...barcodes];
                next[idx] = e.target.value;
                setBarcodes(next);
              }}
            />
            <button type="button" className="px-2" onClick={() => setBarcodes(barcodes.filter((_, i) => i !== idx))}>Eliminar</button>
          </div>
        ))}
        <button type="button" className="mt-1 rounded bg-neutral-200 px-2 py-1" onClick={() => setBarcodes([...barcodes, ''])}>Añadir</button>
      </div>

      <div className="pt-2">
        <button type="submit" className="inline-flex items-center rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black">
          Guardar
        </button>
      </div>
    </form>
  );
}