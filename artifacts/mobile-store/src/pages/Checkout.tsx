import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { useGetCartSummary, getGetCartQueryKey, getGetCartSummaryQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getToken, API_BASE } from "@/lib/auth";
import { Banknote, ShoppingBag } from "lucide-react";

export default function Checkout() {
  const { isLoggedIn } = useAuth();
  const [, navigate] = useLocation();
  const { data: summary } = useGetCartSummary({ query: { enabled: isLoggedIn } });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-muted/10">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
          <div className="bg-card rounded-2xl border p-16 flex flex-col items-center text-center shadow-sm">
            <h2 className="text-2xl font-bold mb-3">Please log in</h2>
            <p className="text-muted-foreground max-w-md mb-8">You need to be logged in to checkout.</p>
            <Link href="/login"><Button size="lg">Log In</Button></Link>
          </div>
        </main>
      </div>
    );
  }

  const isEmpty = !summary || summary.itemCount === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !address.trim() || !phone.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (!/^\d+$/.test(phone.trim())) {
      toast({ title: "Invalid phone number", description: "Phone number should contain digits only.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ customerName, address, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCartSummaryQueryKey() });

      toast({ title: "Order placed!", description: "You will pay cash on delivery." });
      navigate("/orders");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Checkout failed", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (isEmpty) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-muted/10">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
          <div className="bg-card rounded-2xl border p-16 flex flex-col items-center text-center shadow-sm">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Your cart is empty</h2>
            <p className="text-muted-foreground max-w-md mb-8">Add some products before checking out.</p>
            <Link href="/products"><Button size="lg">Start Shopping</Button></Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/10">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="bg-card border rounded-2xl shadow-sm p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="customerName">Full Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Delivery Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Payment Method</Label>
            <div className="flex items-center gap-3 rounded-lg border p-4 bg-primary/5 border-primary/30">
              <Banknote className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">Cash on Delivery</div>
                <div className="text-xs text-muted-foreground">Pay with cash when your order arrives.</div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Subtotal</span>
              <span>${summary?.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${summary?.total.toFixed(2)}</span>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full h-14 text-lg font-bold" disabled={submitting}>
            {submitting ? "Placing order..." : "Place Order"}
          </Button>
        </form>
      </main>
    </div>
  );
}



