import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { useListProducts, useGetProductStats } from "@workspace/api-client-react";
import { useLocation, useSearch } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Products() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const [, setLocation] = useLocation();

  const currentCategory = searchParams.get("category") || "all";
  const currentBrand = searchParams.get("brand") || "all";
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);

  // Simple debounce
  useState(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 500);
    return () => clearTimeout(timer);
  });

  const { data: stats } = useGetProductStats();
  const { data: products, isLoading } = useListProducts({
    category: currentCategory !== "all" ? currentCategory : undefined,
    brand: currentBrand !== "all" ? currentBrand : undefined,
    search: debouncedSearch || undefined,
  });

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchString);
    if (value === "all" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setLocation(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setLocation("/products");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/10">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-4 tracking-tight">Shop</h2>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search products..." 
                className="pl-9 bg-background"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Categories</h3>
            <RadioGroup value={currentCategory} onValueChange={(v) => updateFilters("category", v)} className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="cat-all" />
                <Label htmlFor="cat-all" className="cursor-pointer font-normal">All Categories</Label>
              </div>
              {stats?.categories?.map((c) => (
                <div key={c.name} className="flex items-center space-x-2">
                  <RadioGroupItem value={c.name} id={`cat-${c.name}`} />
                  <Label htmlFor={`cat-${c.name}`} className="cursor-pointer font-normal flex justify-between w-full">
                    <span className="capitalize">{c.name}</span>
                    <span className="text-muted-foreground text-xs">{c.count}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Brands</h3>
            <RadioGroup value={currentBrand} onValueChange={(v) => updateFilters("brand", v)} className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="brand-all" />
                <Label htmlFor="brand-all" className="cursor-pointer font-normal">All Brands</Label>
              </div>
              {stats?.brands?.map((b) => (
                <div key={b.name} className="flex items-center space-x-2">
                  <RadioGroupItem value={b.name} id={`brand-${b.name}`} />
                  <Label htmlFor={`brand-${b.name}`} className="cursor-pointer font-normal flex justify-between w-full">
                    <span>{b.name}</span>
                    <span className="text-muted-foreground text-xs">{b.count}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {(currentCategory !== "all" || currentBrand !== "all" || debouncedSearch) && (
            <Button variant="outline" className="w-full" onClick={clearFilters}>
              <FilterX className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              {currentCategory !== "all" ? <span className="capitalize">{currentCategory}</span> : "All Products"}
            </h1>
            <div className="text-sm text-muted-foreground">
              {products?.length || 0} results
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-[380px] rounded-xl" />
              ))}
            </div>
          ) : products?.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-card rounded-xl border border-dashed">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No products found</h3>
              <p className="text-muted-foreground max-w-md">
                We couldn't find any products matching your current filters. Try adjusting your search or categories.
              </p>
              <Button className="mt-6" variant="outline" onClick={clearFilters}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products?.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
