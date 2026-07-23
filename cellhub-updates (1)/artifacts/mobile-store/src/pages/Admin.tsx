import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Edit, Trash2, PlusCircle, Package } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type ProductForm = {
  name: string;
  brand: string;
  category: string;
  customCategory: string;
  description: string;
  price: string;
  originalPrice: string;
  imageUrl: string;
  badge: string;
  inStock: boolean;
  featured: boolean;
};

const EMPTY_FORM: ProductForm = {
  name: "",
  brand: "",
  category: "smartphones",
  customCategory: "",
  description: "",
  price: "",
  originalPrice: "",
  imageUrl: "",
  badge: "",
  inStock: true,
  featured: false,
};

const PRESET_CATEGORIES = ["smartphones", "accessories", "wearables", "chargers", "other"];

export default function Admin() {
  const { data: products, isLoading } = useListProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    const isPreset = PRESET_CATEGORIES.includes(product.category);
    setForm({
      name: product.name ?? "",
      brand: product.brand ?? "",
      category: isPreset ? product.category : "other",
      customCategory: isPreset ? "" : product.category,
      description: product.description ?? "",
      price: product.price?.toString() ?? "",
      originalPrice: product.originalPrice?.toString() ?? "",
      imageUrl: product.imageUrl ?? "",
      badge: product.badge ?? "",
      inStock: product.inStock ?? true,
      featured: product.featured ?? false,
    });
    setDialogOpen(true);
  };

  const setField = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const buildPayload = () => {
    const price = parseFloat(form.price);
    const originalPrice = form.originalPrice ? parseFloat(form.originalPrice) : undefined;
    const category = form.category === "other" ? form.customCategory.trim() : form.category;

    if (!form.name.trim()) return { error: "Product name is required." };
    if (!form.brand.trim()) return { error: "Brand is required." };
    if (!category) return { error: "Category is required." };
    if (isNaN(price) || price <= 0) return { error: "Enter a valid price." };
    if (originalPrice !== undefined && isNaN(originalPrice)) return { error: "Enter a valid original price." };

    return {
      data: {
        name: form.name.trim(),
        brand: form.brand.trim(),
        category,
        description: form.description.trim() || undefined,
        price,
        originalPrice: originalPrice || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        badge: form.badge.trim() || undefined,
        inStock: form.inStock,
        featured: form.featured,
      },
    };
  };

  const handleSave = async () => {
    const result = buildPayload();
    if ("error" in result) {
      toast({ title: result.error, variant: "destructive" });
      return;
    }

    setSaving(true);
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    };

    if (editingId !== null) {
      updateProduct.mutate(
        { id: editingId, data: result.data },
        {
          onSuccess: () => {
            invalidate();
            setDialogOpen(false);
            toast({ title: "Product updated successfully." });
          },
          onError: () => toast({ title: "Failed to update product.", variant: "destructive" }),
          onSettled: () => setSaving(false),
        }
      );
    } else {
      createProduct.mutate(
        { data: result.data as any },
        {
          onSuccess: () => {
            invalidate();
            setDialogOpen(false);
            toast({ title: "Product created successfully." });
          },
          onError: () => toast({ title: "Failed to create product.", variant: "destructive" }),
          onSettled: () => setSaving(false),
        }
      );
    }
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    deleteProduct.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: "Product deleted." });
        },
        onError: () => toast({ title: "Failed to delete product.", variant: "destructive" }),
        onSettled: () => setDeleteId(null),
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/5">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {products?.length ?? 0} product{(products?.length ?? 0) !== 1 ? "s" : ""} in catalog
            </p>
          </div>
          <Button onClick={openAdd} className="gap-2 shrink-0">
            <PlusCircle className="w-4 h-4" />
            Add Product
          </Button>
        </div>

        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-12">ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : !products?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Package className="w-10 h-10 opacity-30" />
                      <p className="text-sm">No products yet. Add your first product to get started.</p>
                      <Button variant="outline" size="sm" onClick={openAdd} className="gap-1.5">
                        <PlusCircle className="w-3.5 h-3.5" /> Add Product
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} className="group">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{product.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-9 h-9 rounded-lg object-cover border bg-muted shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold truncate max-w-[200px]">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                        </div>
                        {product.badge && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {product.badge}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm">{product.category}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">${(product.price ?? 0).toFixed(2)}</span>
                        {product.originalPrice && product.originalPrice > (product.price ?? 0) && (
                          <span className="text-xs text-muted-foreground line-through">
                            ${product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.inStock ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-xs">
                          In Stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 text-xs">
                          Out of Stock
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.featured ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 text-xs">
                          Featured
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(product)}
                          title="Edit product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(product.id)}
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!saving) setDialogOpen(o); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Core info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="p-name">Product Name <span className="text-destructive">*</span></Label>
                <Input
                  id="p-name"
                  placeholder="e.g. iPhone 16 Pro"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-brand">Brand <span className="text-destructive">*</span></Label>
                <Input
                  id="p-brand"
                  placeholder="e.g. Apple"
                  value={form.brand}
                  onChange={(e) => setField("brand", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-category">Category <span className="text-destructive">*</span></Label>
                <Select value={form.category} onValueChange={(v) => setField("category", v)}>
                  <SelectTrigger id="p-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smartphones">Smartphones</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                    <SelectItem value="wearables">Wearables</SelectItem>
                    <SelectItem value="chargers">Chargers</SelectItem>
                    <SelectItem value="other">Other (custom)</SelectItem>
                  </SelectContent>
                </Select>
                {form.category === "other" && (
                  <Input
                    placeholder="Enter custom category"
                    value={form.customCategory}
                    onChange={(e) => setField("customCategory", e.target.value)}
                    className="mt-1.5"
                  />
                )}
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Price ($) <span className="text-destructive">*</span></Label>
                <Input
                  id="p-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-original-price">
                  Original Price ($)
                  <span className="text-xs text-muted-foreground ml-1">(optional)</span>
                </Label>
                <Input
                  id="p-original-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.originalPrice}
                  onChange={(e) => setField("originalPrice", e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Details */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-description">Description</Label>
                <Textarea
                  id="p-description"
                  placeholder="Describe the product..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  className="resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="p-image">Image URL</Label>
                  <Input
                    id="p-image"
                    placeholder="https://... or /images/..."
                    value={form.imageUrl}
                    onChange={(e) => setField("imageUrl", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-badge">Badge Label</Label>
                  <Input
                    id="p-badge"
                    placeholder='e.g. "New", "Sale", "Hot"'
                    value={form.badge}
                    onChange={(e) => setField("badge", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Toggles */}
            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  id="p-instock"
                  checked={form.inStock}
                  onCheckedChange={(v) => setField("inStock", v)}
                />
                <Label htmlFor="p-instock" className="cursor-pointer">In Stock</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="p-featured"
                  checked={form.featured}
                  onCheckedChange={(v) => setField("featured", v)}
                />
                <Label htmlFor="p-featured" className="cursor-pointer">Featured on Home</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId !== null ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product will be permanently removed from the catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
