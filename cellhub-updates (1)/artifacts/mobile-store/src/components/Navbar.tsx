import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { ShoppingCart, Smartphone, Menu, Search, Package, X, UserCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetCartSummary } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const { data: cartSummary } = useGetCartSummary();
  const itemCount = cartSummary?.itemCount || 0;
  const { user, isLoggedIn } = useAuth();

  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchString]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (trimmed) {
      setLocation(`/products?search=${encodeURIComponent(trimmed)}`);
    } else {
      setLocation("/products");
    }
    setSearchOpen(false);
  };

  const handleClear = () => {
    setSearchValue("");
    inputRef.current?.focus();
  };

  const handleClose = () => {
    setSearchOpen(false);
    setSearchValue(searchParams.get("search") || "");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Left: Logo + Nav */}
        <div className={`flex items-center gap-6 transition-all duration-300 ${searchOpen ? "opacity-0 pointer-events-none w-0 overflow-hidden" : "opacity-100"}`}>
          <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight shrink-0">
            <Smartphone className="w-6 h-6" />
            <span>CellHub</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/products" className="text-foreground/80 hover:text-foreground transition-colors whitespace-nowrap">
              Shop All
            </Link>
            <Link href="/products?category=smartphones" className="text-foreground/80 hover:text-foreground transition-colors whitespace-nowrap">
              Smartphones
            </Link>
            <Link href="/products?category=accessories" className="text-foreground/80 hover:text-foreground transition-colors whitespace-nowrap">
              Accessories
            </Link>
          </nav>
        </div>

        {/* Expanded Search Bar */}
        {searchOpen && (
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 flex items-center gap-2 animate-in slide-in-from-right-4 duration-200"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search phones, accessories, plans..."
                className="pl-9 pr-9 h-10 bg-muted/50 border-border/60 focus-visible:ring-primary"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button type="submit" size="sm" className="px-4 shrink-0">
              Search
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="shrink-0 text-muted-foreground"
            >
              Cancel
            </Button>
          </form>
        )}

        {/* Right: Icons */}
        <div className={`flex items-center gap-2 shrink-0 transition-all duration-200 ${searchOpen ? "opacity-0 pointer-events-none w-0 overflow-hidden" : "opacity-100"}`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* User / Account icon */}
          {isLoggedIn ? (
            <Link href="/account">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                title={`Signed in as ${user?.username}`}
              >
                <UserCircle className="w-5 h-5 text-primary" />
                <span className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-background" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="icon" title="Sign In">
                <LogIn className="w-5 h-5" />
              </Button>
            </Link>
          )}

          {user?.isAdmin && (
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="hidden sm:inline-flex" title="Admin">
                <Package className="w-5 h-5" />
              </Button>
            </Link>
          )}

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative group">
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>

      </div>
    </header>
  );
}
