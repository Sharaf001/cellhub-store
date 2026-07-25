import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, getListProductsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Trash2, PlusCircle, Save, X, PackageCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { getToken, API_BASE } from "@/lib/auth";

const emptyForm = {
  name: "",
  brand: "",
  category: "smartphones",
  price: "",
  inStock: true,
  featured: false,
  badge: "",
  imageUrl: "",
  description: "",
};

type AdminOrder = {
  id: number;
  customerName: string;
  address: string;
  phone: string;
  status: string;
  total: number;
  createdAt: string;
  items: { id: number; productName: string; quantity: number; price: number }[];
};

export default function Admin() {
  const { data: products, isLoading } = useListProducts();
  const deleteProduct = useDeleteProduct();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [editBadge, setEditBadge] = useState<string>("");
  const [editInStock, setEditInStock] = useState<boolean>(true);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const PRODUCTS_PER_PAGE = 10;
  const [productPage, setProductPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const filteredProducts = products?.filter(p => categoryFilter === "all" || p.category === categoryFilter);
  const totalProductPages = Math.max(1, Math.ceil((filteredProducts?.length || 0) / PRODUCTS_PER_PAGE));
  const paginatedProducts = filteredProducts?.slice(
    (productPage - 1) * PRODUCTS_PER_PAGE,
    productPage * PRODUCTS_PER_PAGE
  );
  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    setProductPage(1);
  };

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const loadOrders = () => {
    const token = getToken();
    setOrdersLoading(true);
    fetch(`${API_BASE}/admin/orders`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setOrders(data))
      .finally(() => setOrdersLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleConfirmOrder = async (id: number) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "confirmed" }),
      });
      if (!res.ok) throw new Error("Failed to update order");
      toast({ title: "Order confirmed", description: "The customer has been emailed." });
      loadOrders();
    } catch {
      toast({ title: "Failed to update order", variant: "destructive" });
    }
  };

  const handleMarkDelivered = async (id: number) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "delivered" }),
      });
      if (!res.ok) throw new Error("Failed to update order");
      toast({ title: "Order marked as delivered" });
      loadOrders();
    } catch {
      toast({ title: "Failed to update order", variant: "destructive" });
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to delete order");
      toast({ title: "Order deleted" });
      loadOrders();
    } catch {
      toast({ title: "Failed to delete order", variant: "destructive" });
    }
  };

  const handleClearAllOrders = async () => {
    if (!confirm("Clear ALL orders? This cannot be undone.")) return;
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/admin/orders`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to clear orders");
      toast({ title: "All orders cleared" });
      loadOrders();
    } catch {
      toast({ title: "Failed to clear orders", variant: "destructive" });
    }
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    setEditPrice(product.price.toString());
    setEditBadge(product.badge || "");
    setEditInStock(product.inStock);
  };

  const handleSaveEdit = (id: number) => {
    const price = parseFloat(editPrice);
    if (isNaN(price)) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }

    updateProduct.mutate({ id, data: { price, badge: editBadge.trim() || undefined, inStock: editInStock } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setEditingId(null);
        toast({ title: "Product updated" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: "Product deleted" });
        }
      });
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(form.price);
    if (!form.name.trim() || !form.brand.trim() || isNaN(price)) {
      toast({ title: "Please fill in name, brand, and a valid price", variant: "destructive" });
      return;
    }

    createProduct.mutate(
      {
        data: {
          name: form.name.trim(),
          brand: form.brand.trim(),
          category: form.category,
          price,
          inStock: form.inStock,
          featured: form.featured,
          badge: form.badge.trim() || undefined,
          imageUrl: form.imageUrl.trim() || "/images/phone-1.png",
          description: form.description.trim(),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: "Product created" });
          setForm(emptyForm);
          setAddOpen(false);
        },
        onError: (err: any) => {
          toast({ title: "Failed to create product", description: err?.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/10">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 space-y-12">
        <div>
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Manage Products</h1>

            <div className="flex items-center gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryFilterChange(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="smartphones">Smartphones</option>
                <option value="accessories">Accessories</option>
                <option value="plans">Plans</option>
              </select>

              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="w-4 h-4 mr-2" /> Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="brand">Brand</Label>
                        <Input
                          id="brand"
                          value={form.brand}
                          onChange={(e) => setForm({ ...form, brand: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="smartphones">Smartphones</option>
                          <option value="accessories">Accessories</option>
                          <option value="plans">Plans</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="price">Price</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <Input
                        id="imageUrl"
                        value={form.imageUrl}
                        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                        placeholder="/images/phone-1.png"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="badge">Badge (optional)</Label>
                      <Input
                        id="badge"
                        value={form.badge}
                        onChange={(e) => setForm({ ...form, badge: e.target.value })}
                        placeholder="New, Sale, etc."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.inStock}
                          onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                        />
                        In Stock
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.featured}
                          onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                        />
                        Featured
                      </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createProduct.isPending}>
                        {createProduct.isPending ? "Creating..." : "Create Product"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Badge</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading products...</TableCell>
                  </TableRow>
                ) : filteredProducts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No products found.</TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts?.map(product => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-muted-foreground">{product.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{product.name}</span>
                          <span className="text-xs text-muted-foreground">{product.brand}</span>
                        </div>
                      </TableCell>
                      <TableCell><span className="capitalize">{product.category}</span></TableCell>
                      <TableCell>
                        {editingId === product.id ? (
                          <Input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-24"
                          />
                        ) : (
                          `$${product.price.toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === product.id ? (
                          <Input
                            type="text"
                            value={editBadge}
                            onChange={(e) => setEditBadge(e.target.value)}
                            placeholder="None"
                            className="w-24"
                          />
                        ) : (
                          product.badge || <span className="text-muted-foreground text-xs">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === product.id ? (
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editInStock}
                              onChange={(e) => setEditInStock(e.target.checked)}
                            />
                            In Stock
                          </label>
                        ) : product.inStock ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">In Stock</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">Out of Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {editingId === product.id ? (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(product.id)} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setEditingId(null)} className="text-muted-foreground">
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(product)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && (filteredProducts?.length || 0) > PRODUCTS_PER_PAGE && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {productPage} of {totalProductPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  disabled={productPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProductPage((p) => Math.min(totalProductPages, p + 1))}
                  disabled={productPage === totalProductPages}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Manage Orders</h2>
            {orders.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleClearAllOrders}>
                <Trash2 className="w-4 h-4 mr-2" /> Clear All Orders
              </Button>
            )}
          </div>

          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address / Phone</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading orders...</TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No orders yet.</TableCell>
                  </TableRow>
                ) : (
                  orders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-muted-foreground">#{order.id}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell className="text-sm">
                        <div>{order.address}</div>
                        <div className="text-muted-foreground">{order.phone}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.items.map(i => `${i.productName} x${i.quantity}`).join(", ")}
                      </TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        {order.status === "delivered" ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 capitalize">Delivered</Badge>
                        ) : order.status === "confirmed" ? (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200 capitalize">Confirmed</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-200 capitalize">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {order.status === "pending" && (
                          <Button variant="outline" size="sm" onClick={() => handleConfirmOrder(order.id)}>
                            <PackageCheck className="w-4 h-4 mr-2" /> Confirm Order
                          </Button>
                        )}
                        {order.status === "confirmed" && (
                          <Button variant="outline" size="sm" onClick={() => handleMarkDelivered(order.id)}>
                            <PackageCheck className="w-4 h-4 mr-2" /> Mark Delivered
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
