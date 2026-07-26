import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useListFeaturedProducts, useListCategories } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, Zap, Shield, Truck, Smartphone, Headphones, Watch, BatteryCharging } from "lucide-react";

export default function Home() {
  const { data: featuredProducts, isLoading } = useListFeaturedProducts();
  const { data: categories } = useListCategories();

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'smartphones': return <Smartphone className="w-8 h-8" />;
      case 'accessories': return <Headphones className="w-8 h-8" />;
      case 'wearables': return <Watch className="w-8 h-8" />;
      case 'chargers': return <BatteryCharging className="w-8 h-8" />;
      default: return <Smartphone className="w-8 h-8" />;
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-zinc-950 text-white">
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/hero.png" 
              alt="Premium Technology" 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight mb-6 animate-in slide-in-from-bottom-8 duration-700">
                The Future in <br/> <span className="text-blue-500">Your Hands.</span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-300 mb-8 max-w-lg animate-in slide-in-from-bottom-8 duration-700 delay-150">
                Discover the latest flagship smartphones, premium audio, and next-generation wearables at CellHub.
              </p>
              <div className="flex items-center gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-300">
                <Link href="/products">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 rounded-full font-semibold text-base">
                    Shop Now
                  </Button>
                </Link>
                <Link href="/products?category=smartphones">
                  <Button variant="outline" size="lg" className="h-12 px-8 rounded-full font-semibold text-base border-zinc-700 text-zinc-900 bg-white/10 hover:bg-white/20 backdrop-blur-md">
                    Explore Phones
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 border-b bg-muted/30">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Free Express Shipping</h3>
                <p className="text-sm text-muted-foreground">On all orders over $500</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">2-Year Warranty</h3>
                <p className="text-sm text-muted-foreground">Premium protection included</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Expert Setup</h3>
                <p className="text-sm text-muted-foreground">Free data transfer in-store</p>
              </div>
            </div>
          </div>
        </section>

        {/* Category Highlights */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Shop by Category</h2>
              <p className="text-muted-foreground">Find exactly what you're looking for.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories?.map(category => (
                <Link key={category.id} href={`/products?category=${category.slug}`} className="group block">
                  <div className="bg-muted/30 border border-border/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:bg-primary/5 hover:border-primary/20 hover:-translate-y-1">
                    <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4 text-foreground group-hover:text-primary transition-colors shadow-sm">
                      {getCategoryIcon(category.slug)}
                    </div>
                    <h3 className="font-semibold text-lg capitalize mb-1 group-hover:text-primary transition-colors">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.productCount || 0} {category.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-24 container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Featured Collection</h2>
              <p className="text-muted-foreground">Our hand-picked selection of premium devices.</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" className="gap-2 group hidden sm:flex">
                View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[400px] bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts?.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center sm:hidden">
            <Link href="/products">
              <Button variant="outline" className="w-full">View All Products</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

