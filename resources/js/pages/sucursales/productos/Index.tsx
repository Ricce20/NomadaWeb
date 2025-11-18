import HeadingSmall from "@/components/heading-small";
import AddProductModal from "@/components/productos/add-product-modal";
import EditProductModal from "@/components/productos/edit-product-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppLayoutOwnership from "@/layouts/app-layout-ownership";
import SucursalPartialLayout from "@/layouts/sucursales/layout-partials";
import productos from "@/routes/sucursales/productos";
import { BreadcrumbItem, PaginatedResponse, SucursalItem } from "@/types";
import { Head, Link, router } from "@inertiajs/react";
import debounce from "lodash.debounce";
import { Boxes, ExternalLink, Filter, Plus, Pencil, X, Image } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

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
  image?: string | null;
  branch_image?: string | null;
  catalog_image?: string | null;
  created_at: string;
  updated_at: string;
}

interface Brand {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface Filters extends Record<string, string | undefined> {
  search?: string;
  brand_id?: string;
  category_id?: string;
  sort?: string;
  direction?: string;
}

interface Unit {
  id: number;
  name: string;
  abbreviation: string;
}

interface IndexProps {
  items: PaginatedResponse<ProductoItem>;
  filters: Filters;
  sucursal: SucursalItem;
  can: {
    manage: boolean;
    stock: boolean;
  };
  brands: Brand[];
  categories: Category[];
  units: Unit[];
}

export default function ProductosIndex({
  sucursal,
  items,
  filters,
  can,
  brands,
  categories,
  units,
}: IndexProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Productos",
      href: productos.index(sucursal.id).url,
    },
  ];

  const { toast } = useToast();
  const [filtersData, setFilters] = useState<Filters>({
    search: filters.search || "",
    brand_id: filters.brand_id || "all",
    category_id: filters.category_id || "all",
    sort: filters.sort || "name",
    direction: filters.direction || "asc",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductoItem | null>(null);
  const [search, setSearch] = useState<string>(filters.search || "");

  const productosIndexUrl = productos.index(sucursal.id).url;

  const debouncedFetch = useMemo(
    () =>
      debounce((term: string) => {
        const query = {
          ...filtersData,
          search: term,
          brand_id: filtersData.brand_id === "all" ? undefined : filtersData.brand_id,
          category_id: filtersData.category_id === "all" ? undefined : filtersData.category_id,
        };
        router.get(
          productosIndexUrl,
          query,
          {
            preserveScroll: true,
            preserveState: true,
            replace: true,
            only: ["items", "filters"],
          }
        );
      }, 350),
    [productosIndexUrl, JSON.stringify(filtersData)]
  );

  useEffect(() => {
    return () => {
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  const onChangeSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearch(val);
      debouncedFetch(val);
    },
    [debouncedFetch]
  );

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filtersData, [key]: value };
    setFilters(newFilters);

    const query = {
      ...newFilters,
      brand_id: newFilters.brand_id === "all" ? undefined : newFilters.brand_id,
      category_id: newFilters.category_id === "all" ? undefined : newFilters.category_id,
    };

    router.get(productos.index(sucursal.id).url, query, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
      only: ["items", "filters"],
    });
  };

  const handleResetFilters = () => {
    const resetFilters: Filters = {
      search: "",
      brand_id: "all",
      category_id: "all",
      sort: "name",
      direction: "asc",
    };
    setFilters(resetFilters);
    setSearch("");

    router.get(productos.index(sucursal.id).url, { search: "" }, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
      only: ["items", "filters"],
    });
  };

  const handleEdit = (producto: ProductoItem) => {
    setSelectedProduct(producto);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedProduct(null);
  };

  const isSuperAdmin = useMemo(() => {
    return (window as any).Laravel?.user?.type === "super_admin";
  }, []);

  const hasActiveFilters = useMemo(() => {
    return !!(
      filtersData.search ||
      (filtersData.brand_id && filtersData.brand_id !== "all") ||
      (filtersData.category_id && filtersData.category_id !== "all")
    );
  }, [filtersData]);

  return (
    <AppLayoutOwnership breadcrumbs={breadcrumbs}>
      <Head title={`Productos - ${sucursal.nombre}`} />
      <SucursalPartialLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <HeadingSmall
              title="Productos"
              description="Gestiona los precios y stock de productos en esta sucursal"
            />
            <div className="flex gap-2">
              {isSuperAdmin && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/management/product-bases">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Catálogo corporativo
                  </Link>
                </Button>
              )}
              {can.manage && (
                <Button size="sm" onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar producto
                </Button>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Filtros</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="ml-auto"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Nombre o SKU..."
                  value={search}
                  onChange={onChangeSearch}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Select
                  value={filtersData.brand_id || "all"}
                  onValueChange={(value) => handleFilterChange("brand_id", value)}
                >
                  <SelectTrigger id="brand">
                    <SelectValue placeholder="Todas las marcas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las marcas</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={filtersData.category_id || "all"}
                  onValueChange={(value) => handleFilterChange("category_id", value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tabla */}
          {items.data.length === 0 ? (
            <Empty>
              <EmptyMedia>
                <Boxes className="h-12 w-12" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No hay productos registrados</EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilters
                    ? "No se encontraron productos con los filtros aplicados"
                    : "Agrega productos del catálogo para comenzar a gestionar precios"}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {hasActiveFilters ? (
                  <Button variant="outline" onClick={handleResetFilters}>
                    Limpiar filtros
                  </Button>
                ) : can.manage ? (
                  <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar producto
                  </Button>
                ) : null}
              </EmptyContent>
            </Empty>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Imagen</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>UoM</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    {can.manage && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center justify-center w-12 h-12 rounded-md border bg-muted overflow-hidden">
                          {item.image ? (
                            <img
                              src={`/storage/${item.image}`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<svg class="h-6 w-6 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                              }}
                            />
                          ) : (
                            <Image className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.sku_base}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.brand}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono">
                          ${parseFloat(item.price).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono">{item.stock}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{item.unit || '—'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.stock > 0 ? "default" : "secondary"}>
                          {item.stock > 0 ? "Disponible" : "Sin stock"}
                        </Badge>
                      </TableCell>
                      {can.manage && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación */}
          {items.links && items.links.length > 3 && (
            <div className="flex items-center justify-center gap-1">
              {items.links.map((link, index) => (
                <Button
                  key={index}
                  variant={link.active ? "default" : "outline"}
                  size="sm"
                  disabled={!link.url}
                  onClick={() => {
                    if (link.url) {
                      router.get(link.url);
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          )}
        </div>

        {can.manage && (
          <>
            <AddProductModal
              open={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              sucursalId={sucursal.id}
              brands={brands}
              categories={categories}
              units={units}
            />
            <EditProductModal
              open={isEditModalOpen}
              onClose={handleCloseEditModal}
              sucursalId={sucursal.id}
              producto={selectedProduct}
            />
          </>
        )}
      </SucursalPartialLayout>
    </AppLayoutOwnership>
  );
}
