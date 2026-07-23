import { Navbar } from "@/components/Navbar";
import {
  useGetCart,
  useGetCartSummary,
  useUpdateCartItem,
  useRemoveFromCart,
  getGetCartQueryKey,
  getGetCartSummaryQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, LogIn } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function Cart() {
  const { isLoggedIn } = useAuth();
  const { data: cartItems, isLoading: itemsLoading } = useGetCart({ query: { enabled: isLoggedIn } });
  const { data: summary, isLoading: summaryLoading } = useGetCartSummary({ query: { enabled: isLoggedIn } });
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const queryClient = useQueryClient();

  const handleUpdateQuantity = (id: number, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity < 1) return;

    updateItem.mutate({
      id,
      data: { quantity: newQuantity }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCartSummaryQueryKey() });
      }
    });
  };

  const handleRemove = (id: number) => {
    removeItem.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCartSummaryQueryKey() });
      }
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-muted/10">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
          <div className="bg-card rounded-2xl border p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <LogIn className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Please log in</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              You need to be logged in to view your cart.
            </p>
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 font-bold">Log In</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isLoading = itemsLoading || summaryLoading;
  const isEmpty = !cartItems || cartItems.length === 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/10">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Your Cart</h1>

        {isLoading ? (
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
            <div>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        ) : isEmpty ? (
          <div className="bg-card rounded-2xl border p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Your cart is empty</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Looks like you haven't added any products to your cart yet. Discover our premium devices and accessories.
            </p>
            <Link href="/products">
              <Button size="lg" className="h-12 px-8 font-bold">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-2xl border shadow-sm divide-y">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-6 flex gap-6 items-center">
                    <Link href={`/products/${item.product.id}`} className="block w-24 h-24 bg-muted/30 rounded-lg p-2 shrink-0 border">
                      {item.product.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                      ) : (
                        <div className="w-full h-full bg-muted-foreground/20 rounded" />
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-primary uppercase mb-1">{item.product.brand}</div>
                      <Link href={`/products/${item.product.id}`} className="font-semibold text-lg hover:text-primary transition-colors truncate block">
                        {item.product.name}
                      </Link>
                      <div className="font-bold mt-1">${item.product.price.toFixed(2)}</div>
                    </div>

                    <div className="flex flex-col items-end gap-4 shrink-0">
                      <div className="flex items-center bg-muted rounded-full p-1 border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                          disabled={updateItem.isPending}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-10 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                          disabled={updateItem.isPending}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 -mr-2"
                        onClick={() => handleRemove(item.id)}
                        disabled={removeItem.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl border shadow-sm p-6 lg:sticky lg:top-24">
              <h3 className="text-xl font-bold mb-6">Order Summary</h3>

              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({summary?.itemCount} items)</span>
                  <span className="font-medium">${summary?.subtotal.toFixed(2)}</span>
                </div>
                {summary && summary.discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-${summary.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-8">
                <div className="flex justify-between items-end">
                  <span className="font-semibold text-lg">Total</span>
                  <span className="text-3xl font-bold">${summary?.total.toFixed(2)}</span>
                </div>
              </div>

              <Link href="/checkout">
                <Button size="lg" className="w-full h-14 text-lg font-bold">
                  Checkout <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>

              <p className="text-xs text-center text-muted-foreground mt-4 flex items-center justify-center gap-1">
                Secure encrypted checkout
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

