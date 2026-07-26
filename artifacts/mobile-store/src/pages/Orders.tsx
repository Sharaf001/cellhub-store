import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getToken, API_BASE } from "@/lib/auth";
import { PackageSearch, Banknote } from "lucide-react";

type OrderItem = {
  id: number;
  productName: string;
  price: number;
  quantity: number;
};

type Order = {
  id: number;
  customerName: string;
  address: string;
  phone: string;
  paymentMethod: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

export default function Orders() {
  const { isLoggedIn } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    const token = getToken();
    fetch(`${API_BASE}/orders`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setOrders(data.filter((o: Order) => o.status !== "delivered")))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-muted/10">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
          <div className="bg-card rounded-2xl border p-16 flex flex-col items-center text-center shadow-sm">
            <h2 className="text-2xl font-bold mb-3">Please log in</h2>
            <p className="text-muted-foreground max-w-md mb-8">You need to be logged in to view your orders.</p>
            <Link href="/login"><Button size="lg">Log In</Button></Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/10">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Your Orders</h1>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-card rounded-2xl border p-16 flex flex-col items-center text-center shadow-sm">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <PackageSearch className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-3">No orders yet</h2>
            <p className="text-muted-foreground max-w-md mb-8">Once you place an order, it will show up here.</p>
            <Link href="/products"><Button size="lg">Start Shopping</Button></Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-card border rounded-2xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-semibold text-lg">Order</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">{order.status}</Badge>
                </div>

                <div className="divide-y border-t border-b mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between py-2 text-sm">
                      <span>{item.productName} x{item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Banknote className="w-4 h-4" />
                    Cash on Delivery &middot; {order.address}
                  </div>
                  <div className="font-bold text-lg">${order.total.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}



