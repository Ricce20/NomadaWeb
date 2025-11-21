import HeadingSmall from "@/components/heading-small";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import AppLayoutOwnership from "@/layouts/app-layout-ownership";
import SucursalPartialLayout from "@/layouts/sucursales/layout-partials";
import { BreadcrumbItem, SucursalItem } from "@/types";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { ArrowLeft, Save } from "lucide-react";

interface WarehouseOption {
  id: number;
  name: string;
  is_default: boolean;
}

interface ProductOption {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
}

interface CreateProps {
  sucursal: SucursalItem;
  warehouses: WarehouseOption[];
  products: ProductOption[];
}

export default function MovimientosInventarioCreate({ sucursal, warehouses, products }: CreateProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Movimientos de Inventario",
      href: `/sucursales/${sucursal.id}/movimientos-inventario`,
    },
    {
      title: "Registrar Movimiento",
      href: `/sucursales/${sucursal.id}/movimientos-inventario/create`,
    },
  ];

  const { data, setData, post, processing, errors } = useForm({
    warehouse_id: '',
    product_base_branch_id: '',
    type: 'in',
    quantity: '',
    reason: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/sucursales/${sucursal.id}/movimientos-inventario`);
  };

  const selectedProduct = products.find(p => p.id === Number(data.product_base_branch_id));

  return (
    <AppLayoutOwnership breadcrumbs={breadcrumbs}>
      <Head title={`Registrar Movimiento - ${sucursal.nombre}`} />
      <SucursalPartialLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <HeadingSmall
              title="Registrar Movimiento de Inventario"
              description="Registra entradas o ajustes de stock en los almacenes"
            />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/sucursales/${sucursal.id}/movimientos-inventario`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
            <div className="rounded-lg border bg-card p-6 space-y-6">
              {/* Almacén */}
              <div className="space-y-2">
                <Label htmlFor="warehouse_id">
                  Almacén <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={data.warehouse_id}
                  onValueChange={(value) => setData('warehouse_id', value)}
                >
                  <SelectTrigger id="warehouse_id">
                    <SelectValue placeholder="Selecciona un almacén" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name}
                        {warehouse.is_default && ' (Default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.warehouse_id && (
                  <p className="text-sm text-destructive">{errors.warehouse_id}</p>
                )}
              </div>

              {/* Producto */}
              <div className="space-y-2">
                <Label htmlFor="product_base_branch_id">
                  Producto <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={data.product_base_branch_id}
                  onValueChange={(value) => setData('product_base_branch_id', value)}
                >
                  <SelectTrigger id="product_base_branch_id">
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - {product.sku}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.product_base_branch_id && (
                  <p className="text-sm text-destructive">{errors.product_base_branch_id}</p>
                )}
                {selectedProduct && (
                  <p className="text-sm text-muted-foreground">
                    Stock actual en sucursal: {selectedProduct.current_stock}
                  </p>
                )}
              </div>

              {/* Tipo de Movimiento */}
              <div className="space-y-3">
                <Label>
                  Tipo de Movimiento <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={data.type}
                  onValueChange={(value) => setData('type', value)}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="in" id="type-in" />
                    <Label htmlFor="type-in" className="flex-1 cursor-pointer">
                      <div className="font-medium">Entrada de Stock</div>
                      <div className="text-sm text-muted-foreground">
                        Agregar unidades al inventario (compras, devoluciones, etc.)
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="adjust" id="type-adjust" />
                    <Label htmlFor="type-adjust" className="flex-1 cursor-pointer">
                      <div className="font-medium">Ajuste de Stock</div>
                      <div className="text-sm text-muted-foreground">
                        Establecer cantidad exacta (conteo físico, correcciones)
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type}</p>
                )}
              </div>

              {/* Cantidad */}
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Cantidad <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  placeholder={data.type === 'adjust' ? 'Cantidad final deseada' : 'Cantidad a agregar'}
                  value={data.quantity}
                  onChange={(e) => setData('quantity', e.target.value)}
                />
                {errors.quantity && (
                  <p className="text-sm text-destructive">{errors.quantity}</p>
                )}
                {data.type === 'in' && (
                  <p className="text-sm text-muted-foreground">
                    Se sumarán {data.quantity || '0'} unidades al stock actual
                  </p>
                )}
                {data.type === 'adjust' && (
                  <p className="text-sm text-muted-foreground">
                    El stock se establecerá exactamente en {data.quantity || '0'} unidades
                  </p>
                )}
              </div>

              {/* Motivo */}
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Motivo (opcional)
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Ej: Compra a proveedor X, Ajuste por conteo físico, etc."
                  value={data.reason}
                  onChange={(e) => setData('reason', e.target.value)}
                  rows={3}
                />
                {errors.reason && (
                  <p className="text-sm text-destructive">{errors.reason}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Describe el motivo del movimiento para mantener un registro claro
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <Button type="submit" disabled={processing}>
                {processing ? (
                  <>Guardando...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Movimiento
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.visit(`/sucursales/${sucursal.id}/movimientos-inventario`)}
                disabled={processing}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </SucursalPartialLayout>
    </AppLayoutOwnership>
  );
}
