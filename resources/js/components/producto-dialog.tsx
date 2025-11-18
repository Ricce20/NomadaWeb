import { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import productos from "@/routes/sucursales/productos";
import axios from "axios";

interface ProductBase {
  id: number;
  name: string;
  sku_base: string;
  brand: string;
  category: string;
  unit: string;
}

interface ProductoDialogProps {
  open: boolean;
  onClose: () => void;
  sucursalId: number;
  editingItem?: {
    id: number;
    product_base_id: number;
    name: string;
    price: string;
    stock: number;
  } | null;
}

export default function ProductoDialog({
  open,
  onClose,
  sucursalId,
  editingItem,
}: ProductoDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ProductBase[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductBase | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const { data, setData, post, put, processing, errors, reset } = useForm({
    product_base_id: editingItem?.product_base_id || 0,
    branch_id: sucursalId,
    price: editingItem?.price || "",
    stock: editingItem?.stock || 0,
  });

  useEffect(() => {
    if (editingItem) {
      setData({
        product_base_id: editingItem.product_base_id,
        branch_id: sucursalId,
        price: editingItem.price,
        stock: editingItem.stock,
      });
      setSelectedProduct({
        id: editingItem.product_base_id,
        name: editingItem.name,
        sku_base: "",
        brand: "",
        category: "",
        unit: "",
      });
    } else {
      reset();
      setSelectedProduct(null);
      setSearchTerm("");
      setSearchResults([]);
    }
  }, [editingItem, open]);

  useEffect(() => {
    if (searchTerm.length >= 2 && !editingItem) {
      const delayDebounceFn = setTimeout(() => {
        handleSearch();
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const response = await axios.get("/api/product-bases/search", {
        params: { 
          term: searchTerm,
          exclude_branch_id: sucursalId 
        },
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProduct = (product: ProductBase) => {
    setSelectedProduct(product);
    setData("product_base_id", product.id);
    setSearchResults([]);
    setSearchTerm("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingItem) {
      put(productos.update(sucursalId, editingItem.id).url, {
        preserveScroll: true,
        onSuccess: () => {
          onClose();
          reset();
        },
      });
    } else {
      post(productos.store(sucursalId).url, {
        preserveScroll: true,
        onSuccess: () => {
          onClose();
          reset();
          setSelectedProduct(null);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar precio" : "Agregar precio de producto"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Modifica el precio y stock del producto"
                : "Busca un producto del catálogo y establece su precio para esta sucursal"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Búsqueda de producto (solo al crear) */}
            {!editingItem && (
              <div className="space-y-2">
                <Label htmlFor="search">Buscar producto</Label>
                <Input
                  id="search"
                  placeholder="Escribe el nombre o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!!selectedProduct}
                />
                {errors.product_base_id && (
                  <p className="text-sm text-destructive">{errors.product_base_id}</p>
                )}

                {/* Resultados de búsqueda */}
                {searchResults.length > 0 && (
                  <div className="border rounded-md max-h-48 overflow-y-auto">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b last:border-b-0"
                      >
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.sku_base} • {product.brand} • {product.category}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {isSearching && (
                  <p className="text-sm text-muted-foreground">Buscando...</p>
                )}

                {/* Producto seleccionado */}
                {selectedProduct && (
                  <div className="border rounded-md p-3 bg-muted">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{selectedProduct.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedProduct.brand} • {selectedProduct.category}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(null);
                          setData("product_base_id", 0);
                        }}
                      >
                        Cambiar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Producto en edición */}
            {editingItem && (
              <div className="border rounded-md p-3 bg-muted">
                <div className="font-medium">{editingItem.name}</div>
              </div>
            )}

            {/* Precio */}
            <div className="space-y-2">
              <Label htmlFor="price">Precio *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={data.price}
                onChange={(e) => setData("price", e.target.value)}
                required
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price}</p>
              )}
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                placeholder="0"
                value={data.stock}
                onChange={(e) => setData("stock", parseInt(e.target.value) || 0)}
              />
              {errors.stock && (
                <p className="text-sm text-destructive">{errors.stock}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={processing || (!editingItem && !selectedProduct)}>
              {processing ? "Guardando..." : editingItem ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
