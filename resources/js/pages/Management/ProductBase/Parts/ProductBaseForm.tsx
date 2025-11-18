import { FormEvent, useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import management from '@/routes/management';

type Mode = 'create' | 'edit';

interface KV { key: string; value: string }

interface InitialValues {
  id?: number;
  sku_base?: string;
  name?: string;
  is_active?: boolean;
  brand?: { id: number } | null;
  category?: { id: number } | null;
  uom?: { id: number } | null;
  tax_code?: string;
  barcodes?: Array<{ barcode: string }>;
  specs_json?: Record<string, string> | null;
}

interface Catalogs {
  brands: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  uoms: Array<{ id: number; name: string; abbreviation: string }>;
}

interface Props {
  mode: Mode;
  initialValues?: InitialValues;
  catalogs: Catalogs;
  onSubmit?: (payload: any) => void;
}

export default function ProductBaseForm({ mode, initialValues, catalogs, onSubmit }: Props) {
  const [sku_base, setSku] = useState(initialValues?.sku_base ?? '');
  const [name, setName] = useState(initialValues?.name ?? '');
  const [brand_id, setBrand] = useState<number | ''>(initialValues?.brand?.id ?? '');
  const [category_id, setCategory] = useState<number | ''>(initialValues?.category?.id ?? '');
  const [uom_id, setUom] = useState<number | ''>(initialValues?.uom?.id ?? '');
  const [tax_code, setTaxCode] = useState(initialValues?.tax_code ?? '');
  const [is_active, setActive] = useState(initialValues?.is_active ?? true);
  const [isGeneratingSku, setIsGeneratingSku] = useState(false);
  
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

  const handleGenerateSku = async () => {
    if (!name.trim()) {
      alert('Ingresa un nombre primero para generar el SKU');
      return;
    }
    
    setIsGeneratingSku(true);
    try {
      // Generar SKU simple basado en el nombre
      const cleanName = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8);
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const generatedSku = `${cleanName}-${randomSuffix}`;
      setSku(generatedSku);
    } catch (error) {
      console.error('Error generating SKU:', error);
    } finally {
      setIsGeneratingSku(false);
    }
  };

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
      router.post(management.productBases.store.url(), payload);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Datos generales */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Datos generales</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ej: Cemento gris 50kg"
              required
            />
          </div>

          {/* SKU Base */}
          <div className="md:col-span-2">
            <label htmlFor="sku" className="block text-sm font-medium mb-2">
              SKU Base
            </label>
            <div className="flex gap-2">
              <input
                id="sku"
                type="text"
                value={sku_base}
                onChange={(e) => setSku(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Ej: CEMENT-50KG"
              />
              <button
                type="button"
                onClick={handleGenerateSku}
                disabled={isGeneratingSku}
                className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground ring-offset-background transition-colors hover:bg-secondary/80 disabled:opacity-50"
              >
                {isGeneratingSku ? 'Generando...' : 'Generar SKU'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Deja vacío para generar automáticamente o genera uno basado en el nombre
            </p>
          </div>

          {/* Marca */}
          <div>
            <label htmlFor="brand" className="block text-sm font-medium mb-2">
              Marca <span className="text-red-500">*</span>
            </label>
            <select
              id="brand"
              value={brand_id}
              onChange={(e) => setBrand(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">Selecciona una marca</option>
              {catalogs.brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Categoría <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={category_id}
              onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">Selecciona una categoría</option>
              {catalogs.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Unidad de medida */}
          <div>
            <label htmlFor="uom" className="block text-sm font-medium mb-2">
              Unidad de medida <span className="text-red-500">*</span>
            </label>
            <select
              id="uom"
              value={uom_id}
              onChange={(e) => setUom(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">Selecciona una unidad</option>
              {catalogs.uoms.map((uom) => (
                <option key={uom.id} value={uom.id}>
                  {uom.name} ({uom.abbreviation})
                </option>
              ))}
            </select>
          </div>

          {/* Tax Code */}
          <div>
            <label htmlFor="tax_code" className="block text-sm font-medium mb-2">
              Código de impuesto
            </label>
            <input
              id="tax_code"
              type="text"
              value={tax_code}
              onChange={(e) => setTaxCode(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ej: IVA-16"
            />
          </div>
        </div>

        {/* Activo */}
        <div className="flex items-center gap-2">
          <input
            id="active"
            type="checkbox"
            checked={is_active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          <label htmlFor="active" className="text-sm font-medium cursor-pointer">
            Producto activo
          </label>
        </div>
      </div>

      {/* Especificaciones */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Especificaciones</h3>
        <div className="space-y-2">
          {specs.map((kv, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                placeholder="Clave (Ej: Color)"
                className="w-1/3 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={kv.key}
                onChange={(e) => {
                  const next = [...specs];
                  next[idx] = { ...kv, key: e.target.value };
                  setSpecs(next);
                }}
              />
              <input
                placeholder="Valor (Ej: Gris)"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={kv.value}
                onChange={(e) => {
                  const next = [...specs];
                  next[idx] = { ...kv, value: e.target.value };
                  setSpecs(next);
                }}
              />
              <button
                type="button"
                onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Eliminar
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSpecs([...specs, { key: '', value: '' }])}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            + Añadir especificación
          </button>
        </div>
      </div>

      {/* Códigos de barras */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Códigos de barras</h3>
        <div className="space-y-2">
          {barcodes.map((bc, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                placeholder="Código de barras"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={bc}
                onChange={(e) => {
                  const next = [...barcodes];
                  next[idx] = e.target.value;
                  setBarcodes(next);
                }}
              />
              <button
                type="button"
                onClick={() => setBarcodes(barcodes.filter((_, i) => i !== idx))}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Eliminar
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setBarcodes([...barcodes, ''])}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            + Añadir código de barras
          </button>
        </div>
      </div>

      {/* Botones */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {mode === 'edit' ? 'Actualizar producto' : 'Crear producto'}
        </button>
        <button
          type="button"
          onClick={() => router.visit(management.productBases.index.url())}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
