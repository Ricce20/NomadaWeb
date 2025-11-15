import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import productos from "@/routes/sucursales/productos";
import { router } from "@inertiajs/react";
import axios from "axios";
import { Loader2, Plus, Search, Upload, X, Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ProductBase {
  id: number;
  name: string;
  sku_base: string;
  brand: string;
  brand_id: number;
  category: string;
  category_id: number;
  unit: string;
  unit_name: string;
  image?: string;
  tax_code?: string;
}

interface Brand {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface Unit {
  id: number;
  name: string;
  abbreviation: string;
}

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  sucursalId: number;
  brands?: Brand[];
  categories?: Category[];
  units?: Unit[];
}

export default function AddProductModal({
  open,
  onClose,
  sucursalId,
  brands = [],
  categories = [],
  units = [],
}: AddProductModalProps) {
  const [tab, setTab] = useState<"buscar" | "crear">("buscar");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ProductBase[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductBase | null>(null);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    sku_base: "",
    name: "",
    brand_id: brands?.[0] ? String(brands[0].id) : "none",
    category_id: categories?.[0] ? String(categories[0].id) : "none",
    uom_id: units?.[0] ? String(units[0].id) : "none",
    price: "",
    stock: "",
  });

  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setTab("buscar");
      setSearchTerm("");
      setSearchResults([]);
      setSelectedProduct(null);
      setPrice("");
      setStock("");
      setImageFile(null);
      setImagePreview(null);
      setForm({
        sku_base: "",
        name: "",
        brand_id: brands?.[0] ? String(brands[0].id) : "none",
        category_id: categories?.[0] ? String(categories[0].id) : "none",
        uom_id: units?.[0] ? String(units[0].id) : "none",
        price: "",
        stock: "",
      });
    }
  }, [open, brands, categories, units]);

  // Cargar productos iniciales cuando se abre el tab de búsqueda
  useEffect(() => {
    if (open && tab === "buscar" && searchResults.length === 0 && !selectedProduct && searchTerm === "") {
      handleSearch();
    }
  }, [open, tab]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const delayDebounceFn = setTimeout(() => {
        handleSearch();
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    } else if (searchTerm.length === 0 && tab === "buscar") {
      // Si borra el término, recargar lista inicial
      handleSearch();
    }
  }, [searchTerm]);

  const handleSearch = async () => {
    setIsSearching(true);
    console.log('🔍 Searching products...', {
      sucursalId,
      searchTerm,
      url: `/sucursales/${sucursalId}/productos/catalogo`,
    });
    
    try {
      const response = await axios.get(`/sucursales/${sucursalId}/productos/catalogo`, {
        params: {
          search: searchTerm,
          exclude_added: true,
        },
      });
      
      console.log('✅ Search response:', {
        status: response.status,
        data: response.data,
        dataLength: response.data.data?.length || 0,
      });
      
      setSearchResults(response.data.data || []);
    } catch (error) {
      console.error("❌ Error searching products:", error);
      if (axios.isAxiosError(error)) {
        console.error("Response data:", error.response?.data);
        console.error("Response status:", error.response?.status);
      }
      toast.error("Error al buscar productos");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProduct = (product: ProductBase) => {
    setSelectedProduct(product);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      toast.error("Selecciona un producto");
      return;
    }

    if (!price || parseFloat(price) < 0) {
      toast.error("Ingresa un precio válido");
      return;
    }

    if (!stock || parseInt(stock) < 0) {
      toast.error("Ingresa un stock válido");
      return;
    }

    setIsSubmitting(true);

    router.post(
      `/sucursales/${sucursalId}/productos/from-catalog`,
      {
        product_base_id: selectedProduct.id,
        price: parseFloat(price),
        stock: parseInt(stock),
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success("Producto agregado desde el catálogo");
          onClose();
        },
        onError: (errors) => {
          const errorMessage = Object.values(errors)[0] as string;
          toast.error(errorMessage || "Error al agregar producto");
        },
        onFinish: () => {
          setIsSubmitting(false);
        },
      }
    );
  };

  const isValidCreate =
    form.name.trim().length > 0 &&
    form.brand_id !== "none" &&
    form.category_id !== "none" &&
    form.uom_id !== "none" &&
    form.price !== "" &&
    Number(form.price) >= 0 &&
    form.stock !== "" &&
    Number.isInteger(Number(form.stock)) &&
    Number(form.stock) >= 0;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2048 * 1024) {
        toast.error("La imagen no debe superar los 2MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuickAdd = () => {
    setCreating(true);
    const formData = new FormData();
    
    if (form.sku_base?.trim()) {
      formData.append("sku_base", form.sku_base.trim());
    }
    formData.append("name", form.name.trim());
    formData.append("brand_id", form.brand_id);
    formData.append("category_id", form.category_id);
    formData.append("uom_id", form.uom_id);
    formData.append("price", form.price);
    formData.append("stock", form.stock);
    
    if (imageFile) {
      formData.append("image", imageFile);
    }

    router.post(productos.store(sucursalId).url.replace('/productos', '/productos/quick-add'), formData, {
      preserveScroll: true,
      forceFormData: true,
      onSuccess: () => {
        toast.success("Producto creado y agregado a la sucursal");
        onClose();
        router.reload({ only: ["items", "filters"] });
      },
      onError: (errs: any) => {
        const first = Object.values(errs)[0] as string;
        toast.error(first || "Revisa los campos");
      },
      onFinish: () => setCreating(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Agregar producto</DialogTitle>
          <DialogDescription>
            Busca en el catálogo o crea un producto rápido
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="buscar" className="flex-1">Buscar en catálogo</TabsTrigger>
            <TabsTrigger value="crear" className="flex-1">Crear producto rápido</TabsTrigger>
          </TabsList>

          {/* TAB BUSCAR */}
          <TabsContent value="buscar">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
            {/* Búsqueda de producto */}
            {!selectedProduct && (
              <div className="space-y-2">
                <Label htmlFor="search">Buscar producto</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Escribe el nombre o SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Resultados de búsqueda */}
                {isSearching && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <ScrollArea className="h-[300px] rounded-md border">
                    <div className="p-2 space-y-2">
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleSelectProduct(product)}
                          className="w-full text-left px-3 py-3 hover:bg-muted transition-colors rounded-md border flex gap-3 items-start"
                        >
                          {/* Imagen del producto */}
                          <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                            {product.image ? (
                              <img 
                                src={`/storage/${product.image}`} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          
                          {/* Información del producto */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              SKU: {product.sku_base}
                            </div>
                            <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                              <span>{product.brand}</span>
                              <span>•</span>
                              <span>{product.category}</span>
                              <span>•</span>
                              <span>{product.unit}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {!isSearching && searchTerm.length >= 2 && searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No se encontraron productos
                  </p>
                )}
              </div>
            )}

            {/* Producto seleccionado */}
            {selectedProduct && (
              <>
                <div className="rounded-md border p-4 bg-muted/50">
                  <div className="flex gap-3">
                    {/* Imagen del producto seleccionado */}
                    <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      {selectedProduct.image ? (
                        <img 
                          src={`/storage/${selectedProduct.image}`} 
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Información */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{selectedProduct.name}</div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {selectedProduct.sku_base}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {selectedProduct.brand} • {selectedProduct.category} • {selectedProduct.unit}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedProduct(null)}
                        >
                          Cambiar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Precio */}
                <div className="space-y-2">
                  <Label htmlFor="price">Precio *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                {/* Stock */}
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
          </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || !selectedProduct}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* TAB CREAR */}
          <TabsContent value="crear">
            <div className="space-y-3 py-4">
              <div>
                <Label>SKU (opcional)</Label>
                <Input
                  value={form.sku_base}
                  onChange={(e) => setForm((f) => ({ ...f, sku_base: e.target.value }))}
                  placeholder="Si lo dejas vacío, se genera automáticamente"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Si no escribes un SKU, generaremos uno por ti.
                </p>
              </div>

              <div>
                <Label>Nombre del producto *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. Martillo carpintero"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Marca *</Label>
                  <Select
                    value={form.brand_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, brand_id: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Marca" /></SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoría *</Label>
                  <Select
                    value={form.category_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unidad *</Label>
                  <Select
                    value={form.uom_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, uom_id: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Unidad" /></SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Precio *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Stock *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Imagen del producto */}
              <div className="space-y-2">
                <Label>Imagen del producto (opcional)</Label>
                {imagePreview ? (
                  <div className="relative">
                    <div className="w-full h-32 rounded-md border overflow-hidden flex items-center justify-center bg-muted">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={creating}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Formatos: JPG, PNG, GIF, WEBP. Tamaño máximo: 2MB
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={onClose} disabled={creating}>
                  Cancelar
                </Button>
                <Button disabled={!isValidCreate || creating} onClick={handleQuickAdd}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
