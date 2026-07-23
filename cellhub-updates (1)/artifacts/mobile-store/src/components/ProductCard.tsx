import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@workspace/api-client-react";
import { useAddToCart, getGetCartSummaryQueryKey, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/auth";

export function ProductCard({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const addToCart = useAddToCart();
  const [, setLocation] = useLocation();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!getToken()) {
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

  return (
    <Link href={`/products/${product.id}`} className="group h-full flex">
      <Card className="flex flex-col w-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 bg-card group-hover:border-primary/20">
        <div className="relative aspect-square bg-muted/30 p-6 flex items-center justify-center overflow-hidden">
          {product.badge && (
            <Badge className="absolute top-3 left-3 z-10 font-bold tracking-wide pointer-events-none">
              {product.badge}
            </Badge>
          )}
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-110" 
              loading="lazy"
            />
          ) : (
            <div className="w-24 h-32 bg-muted-foreground/20 rounded-md"></div>
          )}
          
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          <Button 
            size="icon" 
            className="absolute bottom-3 right-3 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-md"
            onClick={handleAddToCart}
            disabled={!product.inStock}
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
        
        <CardContent className="flex-1 flex flex-col p-5 gap-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {product.brand}
          </div>
          <h3 className="font-semibold text-base line-clamp-2 flex-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mt-auto pt-2">
            <span className="font-bold text-lg">${product.price.toFixed(2)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
