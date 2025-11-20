import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import productos from "@/routes/sucursales/productos";
import { router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { saleTypeOptions, type SaleType } from "@/lib/sale-types";

interface ProductoItem {
  id: number;
  product_base_id: number;
  name: string;
  sku_base: string;
  brand: string;
  category: string;
  unit: string;
  price: string;
  stock: number;
  sale_type: string;
  image?: string | null;
  branch_image?: string | null;
  catalog_image?: string | null;
}

interface EditProductModalProps {
  open: boolean;
  onClose: () => void;
  sucursalId: number;
  producto: ProductoItem | null;
}

export default function EditProductModal({
  open,
  onClose,
  sucursalId,
  producto,
}: EditProductModalProps) {
  const { toast } = useToast();
  const [price, setPrice] = useState<string>("");
  const [stock, setStock] = useState<string>("");
  const [saleType, setSaleType] = useState<SaleType>("unit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (producto) {
      setPrice(producto.price);
      setStock(producto.stock.toString());
      setSaleType((producto.sale_type || "unit") as SaleType);
      setImagePreview(null);
      setImageFile(null);
    }
  }, [producto]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2048 * 1024) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "La imagen no debe superar los 2MB",
        });
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

  const handleUploadImage = () => {
    if (!imageFile || !producto) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("image", imageFile);

    router.post(
      productos.updateImage({ sucursal: sucursalId, pivot: producto.id }).url,
      formData,
      {
        preserveScroll: true,
        forceFormData: true,
        onSuccess: () => {
          toast({
            title: "Imagen actualizada",
            description: "La imagen de sucursal se actualizó correctamente",
          });
          setImageFile(null);
          setImagePreview(null);
        },
        onError: (errors) => {
          const errorMessage = Object.values(errors)[0] as string;
          toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage || "Error al subir la imagen",
          });
        },
        onFinish: () => {
          setIsUploadingImage(false);
        },
      }
    );
  };

  const handleDeleteBranchImage = () => {
    if (!producto) return;

    setIsDeletingImage(true);

    router.delete(
      `/sucursales/${sucursalId}/productos/${producto.id}/image`,
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({
            title: "Imagen eliminada",
            description: "Ahora se mostrará la imagen del catálogo",
          });
        },
        onError: (errors) => {
          const errorMessage = Object.values(errors)[0] as string;
          toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage || "Error al eliminar la imagen",
          });
        },
        onFinish: () => {
          setIsDeletingImage(false);
        },
      }
    );
  };

  const handleDeleteProduct = () => {
    if (!producto) return;

    setIsDeleting(true);

    router.delete(
      productos.destroy({ sucursal: sucursalId, pivot: producto.id }).url,
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({
            title: "Eliminado",
            description: `"${producto.name}" eliminado de la sucursal`,
          });
          onClose();
        },
        onError: (errors) => {
          const errorMessage = Object.values(errors)[0] as string;
          toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage || "Error al eliminar producto",
          });
        },
        onFinish: () => {
          setIsDeleting(false);
          setShowDeleteConfirm(false);
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!producto) return;

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock);

    if (isNaN(priceNum) || priceNum < 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El precio debe ser un número válido mayor o igual a 0",
      });
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El stock debe ser un número válido mayor o igual a 0",
      });
      return;
    }

    setIsSubmitting(true);

    router.put(
      productos.update({ sucursal: sucursalId, pivot: producto.id }).url,
      {
        price: priceNum,
        stock: stockNum,
        sale_type: saleType,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({
            title: "Actualizado",
            description: "Producto actualizado correctamente",
          });
          onClose();
        },
        onError: (errors) => {
          const errorMessage = Object.values(errors)[0] as string;
          toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage || "Error al actualizar producto",
          });
        },
        onFinish: () => {
          setIsSubmitting(false);
        },
      }
    );
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!producto) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
            <DialogDescription>
              Modifica el precio, stock e imagen de este producto en la sucursal
            </DialogDescription>
          </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Información del producto */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-start gap-3">
                {/* Imagen del producto */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : producto.image ? (
                      <img
                        src={`/storage/${producto.image}`}
                        alt={producto.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.innerHTML =
                            '<svg class="h-8 w-8 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                        }}
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Información del producto */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{producto.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {producto.sku_base}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Marca: {producto.brand}</span>
                    <span>•</span>
                    <span>Categoría: {producto.category}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gestión de imágenes */}
            <div className="space-y-4">
              {/* Imagen de sucursal */}
              <div className="space-y-2">
                <Label>Imagen de la sucursal</Label>
                <div className="rounded-lg border p-3 space-y-3">
                  {producto.branch_image ? (
                    <div className="space-y-2">
                      <div className="w-full h-32 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                        <img
                          src={`/storage/${producto.branch_image}`}
                          alt="Imagen de sucursal"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteBranchImage}
                        disabled={isDeletingImage}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeletingImage ? "Eliminando..." : "Quitar imagen personalizada"}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay imagen personalizada. Se usa la imagen del catálogo.
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isUploadingImage}
                        className="flex-1"
                      />
                      {imageFile && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleUploadImage}
                          disabled={isUploadingImage}
                        >
                          {isUploadingImage ? (
                            "Subiendo..."
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-1" />
                              Subir
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    {imagePreview && (
                      <div className="w-full h-32 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Sube una imagen personalizada para esta sucursal. Formatos: JPG, PNG, GIF, WEBP. Máx: 2MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Imagen del catálogo (solo lectura) */}
              <div className="space-y-2">
                <Label>Imagen del catálogo (solo lectura)</Label>
                <div className="rounded-lg border p-3 bg-muted/30">
                  {producto.catalog_image ? (
                    <div className="w-full h-32 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                      <img
                        src={`/storage/${producto.catalog_image}`}
                        alt="Imagen del catálogo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Este producto no tiene imagen en el catálogo</p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Esta es la imagen corporativa del producto. Solo puede modificarse desde el dashboard de management.
                  </p>
                </div>
              </div>
            </div>

            {/* Precio */}
            <div className="space-y-2">
              <Label htmlFor="price">
                Precio <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="stock">
                Stock <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  required
                  disabled={isSubmitting}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {producto.unit}
                </span>
              </div>
            </div>

            {/* Tipo de venta */}
            <div className="space-y-2">
              <Label htmlFor="sale_type">
                Tipo de venta <span className="text-destructive">*</span>
              </Label>
              <Select value={saleType} onValueChange={(v) => setSaleType(v as SaleType)}>
                <SelectTrigger id="sale_type">
                  <SelectValue placeholder="Selecciona tipo de venta" />
                </SelectTrigger>
                <SelectContent>
                  {saleTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
                className="flex-1 sm:flex-none"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar producto
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting || isDeleting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isDeleting}>
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Confirmación de eliminación */}
    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar producto de la sucursal?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará "{producto?.name}" de esta sucursal. El producto seguirá
            existiendo en el catálogo corporativo y podrás agregarlo nuevamente más tarde.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteProduct}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
