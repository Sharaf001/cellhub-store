import { Navbar } from "@/components/Navbar";
import { useGetProduct, useAddToCart, getGetCartSummaryQueryKey, getGetCartQueryKey, useListProducts } from "@workspace/api-client-react";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Check, ShieldCheck, ArrowLeft, Star, LogIn } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ProductCard } from "@/components/ProductCard";
import { getToken } from "@/lib/auth";

export default function ProductDetail() {
  const { id } = useParams();
  const productId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  
  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId }
  });
  
  const { data: relatedProducts } = useListProducts(
    { category: product?.category },
    { query: { enabled: !!product } }
  );

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const addToCart = useAddToCart();
  const isLoggedIn = !!getToken();

  const handleAddToCart = () => {
    if (!product) return;

    if (!isLoggedIn) {
      toast({
        title: "Login required",
        description: "Please sign in to add items to your cart.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }
    
    addToCart.mutate({
      data: { productId: product.id, quantity: 1 }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({
          title: "Added to cart",
          description: `${product.name} has been added to your cart.`,
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold mb-4">Product not found</h1>
          <Link href="/products">
            <Button variant="outline"><ArrowLeft className="mr-2 w-4 h-4"/> Back to Shop</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/20">
          <div className="container mx-auto px-4 py-4 flex items-center text-sm text-muted-foreground gap-2">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-foreground">Products</Link>
            <span>/</span>
            <Link href={`/products?category=${product.category}`} className="hover:text-foreground capitalize">{product.category}</Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate">{product.name}</span>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-24 mb-24">
            {/* Image Gallery */}
            <div className="relative bg-muted/30 rounded-3xl p-12 flex items-center justify-center aspect-square border">
              {product.badge && (
                <Badge className="absolute top-6 left-6 text-sm px-3 py-1 font-bold z-10">
                  {product.badge}
                </Badge>
              )}
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                />
              ) : (
                <div className="w-48 h-64 bg-muted-foreground/20 rounded-xl" />
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col pt-4">
              <div className="text-sm font-bold text-primary uppercase tracking-widest mb-2">
                {product.brand}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating || 5) ? 'fill-current' : 'fill-muted text-muted'}`} />
                  ))}
                </div>
                <span className="text-muted-foreground text-sm">
                  ({product.reviewCount || 0} reviews)
                </span>
              </div>

              <div className="flex items-end gap-4 mb-8 pb-8 border-b">
                <span className="text-4xl font-bold">${(product.price ?? 0).toFixed(2)}</span>
                {product.originalPrice && product.originalPrice > (product.price ?? 0) && (
                  <span className="text-xl text-muted-foreground line-through mb-1">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {product.description || "Experience the next level of technology with this premium device, crafted for excellence."}
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="font-medium">In Stock & Ready to Ship</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="font-medium">2-Year Premium Warranty</span>
                </div>
              </div>

              {!isLoggedIn ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-14 text-lg font-bold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={handleAddToCart}
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In to Add to Cart
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg font-bold shadow-lg hover:-translate-y-1 transition-transform" 
                  onClick={handleAddToCart}
                  disabled={!product.inStock || addToCart.isPending}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {addToCart.isPending ? "Adding..." : product.inStock ? "Add to Cart" : "Out of Stock"}
                </Button>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts && relatedProducts.length > 1 && (
            <div className="pt-16 border-t">
              <h2 className="text-2xl font-bold mb-8">You might also like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts
                  .filter(p => p.id !== product.id)
                  .slice(0, 4)
                  .map(p => (
                    <ProductCard key={p.id} product={p} />
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
