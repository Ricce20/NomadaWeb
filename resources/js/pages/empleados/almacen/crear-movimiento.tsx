import HeadingSmall from "@/components/heading-small";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/layouts/app-layout";
import inventario from "@/routes/sucursal/inventario";
import orders from "@/routes/sucursal/orders";
import { BreadcrumbItem, SucursalItem } from "@/types";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { ArrowLeft, Save, Search, X, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";

interface WarehouseOption {
  id: number;
  nombre: string;
  activo: boolean;
}

interface ProductOption {
  id: number;
  product_base_id: number;
  nombre: string;
  descripcion: string;
  sku: string;
  unidad_medida: string;
  precio: number;
  imagen_url: string | null;
  marca: string | null;
  categoria: string | null;
  sale_type: string;
  current_stock: number;
}

interface ProductItem {
  product_base_branch_id: string;
  quantity: string;
  notes: string;
  product_data?: ProductOption; // Datos completos del producto para mostrar
}

interface CreateProps {
  sucursal: SucursalItem;
  warehouses: WarehouseOption[];
}

export default function MovimientosInventarioCreate({ sucursal, warehouses }: CreateProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Movimientos de Inventario",
      href: `/sucursal/inventario/movimientos`,
    },
    {
      title: "Registrar Movimiento",
      href: `/sucursal/inventario/generar-movimiento`,
    },
  ];

  // Estado para los productos del movimiento
  const [productItems, setProductItems] = useState<ProductItem[]>([
    { product_base_branch_id: '', quantity: '', notes: '' }
  ]);

  // Estados para la búsqueda de productos
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ProductOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number | null>(null); // Índice del producto que se está buscando
  const searchRef = useRef<HTMLDivElement>(null);

  const { data, setData, post, processing, errors } = useForm({
    almacen_id: '',
    type: 'in',
    reason: '',
    status: 'pendiente',
    sucursal_id: sucursal.id,
    products: productItems,
  });

  let finalStock:number | null = 0;

  // Búsqueda de productos con debounce
  const searchProducts = useCallback(
    async (search: string) => {
      if (!search.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const params = new URLSearchParams({
          search: search.trim(),
          sucursal_id: sucursal.id.toString()
        });
        
        // Si hay un almacén seleccionado, agregarlo a la búsqueda
        if (data.almacen_id) {
          params.append('warehouse_id', data.almacen_id);
        }
        
        const response = await fetch(`${orders.searchProducts().url}?${params.toString()}`, {
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Error en la búsqueda:', errorData?.message || 'Error desconocido');
          setSearchResults([]);
          return;
        }
        
        const result = await response.json();
        
        // Manejar la nueva estructura de respuesta
        if (result.success) {
          setSearchResults(result.data || []);
        } else {
          console.error('Error en la búsqueda:', result.message);
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error buscando productos:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [sucursal.id, data.almacen_id]
  );

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchProducts]);

  // Cerrar resultados al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Actualizar búsqueda cuando cambie el almacén
  useEffect(() => {
    if (data.almacen_id && searchTerm) {
      searchProducts(searchTerm);
    }
  }, [data.almacen_id]);

  // Manejar selección de producto
  const handleProductSelect = (product: ProductOption, index: number) => {
    const newItems = productItems.map((item, i) => 
      i === index 
        ? { 
            ...item, 
            product_base_branch_id: product.id.toString(),
            product_data: product
          } 
        : item
    );
    
    setProductItems(newItems);
    setData('products', newItems);
    setSearchTerm('');
    setShowResults(false);
    setSearchResults([]);
    setCurrentSearchIndex(null);
  };

  // Limpiar selección de producto
  const clearProductSelection = (index: number) => {
    const newItems = productItems.map((item, i) => 
      i === index 
        ? { product_base_branch_id: '', quantity: '', notes: '' }
        : item
    );
    
    setProductItems(newItems);
    setData('products', newItems);
  };

  // Agregar nuevo producto
  const addProductItem = () => {
    const newItems = [...productItems, { product_base_branch_id: '', quantity: '', notes: '' }];
    setProductItems(newItems);
    setData('products', newItems);
  };

  // Eliminar producto
  const removeProductItem = (index: number) => {
    if (productItems.length > 1) {
      const newItems = productItems.filter((_, i) => i !== index);
      setProductItems(newItems);
      setData('products', newItems);
    }
  };

  // Actualizar cantidad
  const updateQuantity = (index: number, quantity: string) => {
    const newItems = productItems.map((item, i) => 
      i === index ? { ...item, quantity } : item
    );
    setProductItems(newItems);
    setData('products', newItems);
  };

  // Actualizar notas
  const updateNotes = (index: number, notes: string) => {
    const newItems = productItems.map((item, i) => 
      i === index ? { ...item, notes } : item
    );
    setProductItems(newItems);
    setData('products', newItems);
  };

  // Iniciar búsqueda para un producto específico
  const startSearchForProduct = (index: number) => {
    setCurrentSearchIndex(index);
    setSearchTerm('');
    setShowResults(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que al menos un producto tenga cantidad
    const hasValidProducts = productItems.some(item => 
      item.product_base_branch_id && item.quantity && parseInt(item.quantity) > 0
    );
    
    if (!hasValidProducts) {
      alert('Debe agregar al menos un producto con cantidad válida');
      return;
    }

    post(inventario.generar.store().url, {
      onError: (errors) => {
        console.log("Errores de validación:", errors);
      },
      onSuccess: () => {
        console.log("Movimiento registrado con éxito");
      }
    });
  };

  // Calcular stock final para un producto específico
  const calculateFinalStock = (productItem: ProductItem) => {
    if (!productItem.product_data || !productItem.quantity) return null;
    
    const currentStock = productItem.product_data.current_stock || 0;
    const quantity = parseInt(productItem.quantity) || 0;

    switch (data.type) {
      case 'in':
        return currentStock + quantity;
      case 'out':
        return currentStock - quantity;
      case 'adjust':
        return quantity;
      default:
        return currentStock;
    }
  };

  // Calcular totales
  const totalQuantity = productItems.reduce((sum, item) => 
    sum + (parseInt(item.quantity) || 0), 0
  );

  const totalProducts = productItems.filter(item => 
    item.product_base_branch_id && item.quantity
  ).length;

  // Función para formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Registrar Movimiento - ${sucursal.nombre}`} />
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <HeadingSmall
            title="Registrar Movimiento de Inventario"
            description="Registra entradas, salidas o ajustes de stock para múltiples productos"
          />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/sucursal/inventario/movimientos`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border bg-card p-6 space-y-6">
            {/* Información general del movimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Almacén */}
              <div className="space-y-2">
                <Label htmlFor="warehouse_id">
                  Almacén <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={data.almacen_id}
                  onValueChange={(value) => setData('almacen_id', value)}
                >
                  <SelectTrigger id="warehouse_id" className="w-full">
                    <SelectValue placeholder="Selecciona un almacén" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.nombre}
                        {warehouse.activo && ' (Activo)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.almacen_id && (
                  <p className="text-sm text-destructive">{errors.almacen_id}</p>
                )}
              </div>

              {/* Tipo de Movimiento */}
              <div className="space-y-2">
                <Label htmlFor="type">
                  Tipo de Movimiento <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={data.type}
                  onValueChange={(value) => setData('type', value)}
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Entrada de Stock</SelectItem>
                    <SelectItem value="out">Salida por Venta</SelectItem>
                    <SelectItem value="adjust">Ajuste de Stock</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type}</p>
                )}
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Motivo del movimiento
              </Label>
              <Textarea
                id="reason"
                placeholder={
                  data.type === 'out' ? 
                  'Ej: Venta a cliente X, Merma por caducidad, Daño de producto, etc.' :
                  'Ej: Compra a proveedor X, Ajuste por conteo físico, Devolución de cliente, etc.'
                }
                value={data.reason}
                onChange={(e) => setData('reason', e.target.value)}
                rows={2}
                className="w-full"
              />
              {errors.reason && (
                <p className="text-sm text-destructive">{errors.reason}</p>
              )}
            </div>

            {/* Lista de productos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Productos del movimiento</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProductItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </Button>
              </div>

              {productItems.map((productItem, index) => {
                finalStock = calculateFinalStock(productItem);
                const product = productItem.product_data;

                return (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium">Producto {index + 1}</h4>
                      {productItems.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeProductItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Búsqueda de producto */}
                    <div className="space-y-2" ref={index === currentSearchIndex ? searchRef : null}>
                      <Label>
                        Producto <span className="text-destructive">*</span>
                      </Label>
                      
                      {product ? (
                        // Producto seleccionado
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="flex items-start gap-3">
                            {product.imagen_url ? (
                              <img 
                                src={product.imagen_url} 
                                alt={product.nombre}
                                className="w-12 h-12 rounded-md object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-medium">{product.nombre}</div>
                              <div className="text-sm text-muted-foreground">
                                SKU: {product.sku} | {product.unidad_medida}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {product.marca && `Marca: ${product.marca} | `}
                                {product.categoria && `Categoría: ${product.categoria}`}
                              </div>
                              <div className="text-sm font-medium text-green-600">
                                Precio: {formatPrice(product.precio)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Stock actual: {product.current_stock}
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => clearProductSelection(index)}
                            className="mt-2"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cambiar producto
                          </Button>
                        </div>
                      ) : (
                        // Búsqueda de producto
                        <div className="relative">
                          <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="text"
                              placeholder="Buscar producto por nombre o SKU..."
                              value={index === currentSearchIndex ? searchTerm : ''}
                              onChange={(e) => {
                                if (index === currentSearchIndex) {
                                  setSearchTerm(e.target.value);
                                }
                              }}
                              onFocus={() => startSearchForProduct(index)}
                              className="w-full pl-10"
                            />
                          </div>

                          {/* Resultados de búsqueda */}
                          {currentSearchIndex === index && showResults && (searchTerm || searchResults.length > 0) && (
                            <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                              {isSearching ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  Buscando productos...
                                </div>
                              ) : searchResults.length === 0 && searchTerm ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  No se encontraron productos
                                </div>
                              ) : (
                                searchResults.map((product) => (
                                  <button
                                    key={product.id}
                                    type="button"
                                    className="w-full p-3 text-left hover:bg-muted/50 border-b last:border-b-0"
                                    onClick={() => handleProductSelect(product, index)}
                                  >
                                    <div className="flex items-start gap-3">
                                      {product.imagen_url ? (
                                        <img 
                                          src={product.imagen_url} 
                                          alt={product.nombre}
                                          className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{product.nombre}</div>
                                        <div className="text-sm text-muted-foreground">
                                          SKU: {product.sku} | {product.unidad_medida}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {product.marca && `Marca: ${product.marca} | `}
                                          {product.categoria && `Categoría: ${product.categoria}`}
                                        </div>
                                        <div className="text-sm font-medium text-green-600">
                                          {formatPrice(product.precio)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          Stock: {product.current_stock}
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {errors[`products.${index}.product_base_branch_id`] && (
                        <p className="text-sm text-destructive">
                          {errors[`products.${index}.product_base_branch_id`]}
                        </p>
                      )}
                    </div>

                    {/* Cantidad y notas */}
                    {product && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`quantity-${index}`}>
                            Cantidad <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id={`quantity-${index}`}
                            type="number"
                            min="1"
                            step="1"
                            placeholder={
                              data.type === 'adjust' ? 'Cantidad final deseada' : 
                              data.type === 'out' ? 'Cantidad a descontar' : 
                              'Cantidad a agregar'
                            }
                            value={productItem.quantity}
                            onChange={(e) => updateQuantity(index, e.target.value)}
                            className="w-full"
                          />
                          {errors[`products.${index}.quantity`] && (
                            <p className="text-sm text-destructive">
                              {errors[`products.${index}.quantity`]}
                            </p>
                          )}
                          {finalStock !== null && (
                            <p className={`text-sm ${
                              finalStock < 0 ? 'text-destructive font-medium' : 'text-muted-foreground'
                            }`}>
                              Stock actual: {product.current_stock} → Stock final: {finalStock}
                              {finalStock < 0 && ' (Stock insuficiente)'}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`notes-${index}`}>
                            Notas (opcional)
                          </Label>
                          <Input
                            id={`notes-${index}`}
                            placeholder="Observaciones específicas"
                            value={productItem.notes}
                            onChange={(e) => updateNotes(index, e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Resumen */}
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Resumen del movimiento:</span>
                <span>{totalProducts} producto(s) - {totalQuantity} unidad(es)</span>
              </div>
            </div>

            {/* Estado del Movimiento */}
            <div className="space-y-3">
              <Label>
                Estado del Movimiento <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={data.status}
                onValueChange={(value) => setData('status', value)}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="pendiente" id="status-pending" />
                  <Label htmlFor="status-pending" className="flex-1 cursor-pointer">
                    <div className="font-medium">Pendiente</div>
                    <div className="text-sm text-muted-foreground">
                      El movimiento está registrado pero no se ha aplicado al inventario
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="completado" id="status-completed" />
                  <Label htmlFor="status-completed" className="flex-1 cursor-pointer">
                    <div className="font-medium">Completado</div>
                    <div className="text-sm text-muted-foreground">
                      El movimiento se ha aplicado exitosamente al inventario
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status}</p>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <Button 
              type="submit" 
              disabled={processing || totalProducts === 0 ||  finalStock < 0 }
              className="flex items-center gap-2"
            >
              {processing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Movimiento
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.visit(`/sucursal/inventario/movimientos`)}
              disabled={processing}
            >
              Cancelar
            </Button>
          </div>
        </form>

        {/* Información adicional */}
        <div className="rounded-lg border bg-muted/50 p-4 max-w-2xl">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Información importante:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Entrada:</strong> Aumenta el stock disponible (compras, devoluciones)</li>
              <li><strong>Salida por Venta:</strong> Reduce el stock disponible (ventas, mermas)</li>
              <li><strong>Ajuste:</strong> Establece el stock exacto (conteo físico, correcciones)</li>
              <li><strong>Pendiente:</strong> Movimiento registrado pero no aplicado</li>
              <li><strong>Completado:</strong> Movimiento aplicado al inventario</li>
              <li>Puede agregar múltiples productos en un solo movimiento</li>
              <li>Todos los movimientos quedan registrados en el historial</li>
              <li>Verifica la información antes de guardar</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}