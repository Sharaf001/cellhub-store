import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { ShoppingCart, Smartphone, Menu, Search, X, LogOut, LogIn, PackageSearch, UserCircle2, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetCartSummary } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { getStoredTheme, applyTheme, type Theme } from "@/lib/theme";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function Navbar() {
  const { data: cartSummary } = useGetCartSummary();
  const itemCount = cartSummary?.itemCount || 0;
  const { user, isLoggedIn, logout } = useAuth();
  const [, navigate] = useLocation();

  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(getStoredTheme());

  const handleThemeToggle = (checked: boolean) => {
    const newTheme: Theme = checked ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
  };

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

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
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
        <div className={`flex items-center gap-1 sm:gap-2 shrink-0 transition-all duration-200 ${searchOpen ? "opacity-0 pointer-events-none w-0 overflow-hidden" : "opacity-100"}`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Button>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetContent side="right" className="w-full max-w-xs sm:max-w-sm flex flex-col p-0">
              <SheetHeader className="p-6 border-b text-left">
                <SheetTitle className="flex items-center gap-2 text-primary">
                  <Smartphone className="w-5 h-5" /> CellHub Menu
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col p-4 gap-1 text-sm font-medium">
                <Link href="/products" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-muted transition-colors">
                  Shop All
                </Link>
                <Link href="/products?category=smartphones" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-muted transition-colors">
                  Smartphones
                </Link>
                <Link href="/products?category=accessories" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-muted transition-colors">
                  Accessories
                </Link>

                <div className="h-px bg-border my-2" />

                <div className="px-3 py-2.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    Dark Mode
                  </span>
                  <Switch checked={theme === "dark"} onCheckedChange={handleThemeToggle} />
                </div>

                <div className="h-px bg-border my-2" />

                <Link href="/cart" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-muted transition-colors flex items-center justify-between">
                  <span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Cart</span>
                  {itemCount > 0 && (
                    <span className="w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center rounded-full">
                      {itemCount}
                    </span>
                  )}
                </Link>

                {isLoggedIn ? (
                  <>
                    <Link href="/orders" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-muted transition-colors flex items-center gap-2">
                      <PackageSearch className="w-4 h-4" /> Your Orders
                    </Link>
                    <Link href="/account" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-muted transition-colors flex items-center gap-2">
                      <UserCircle2 className="w-4 h-4" /> Account Center
                    </Link>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-muted transition-colors flex items-center gap-2">
                    <LogIn className="w-4 h-4" /> Login / Register
                  </Link>
                )}
              </nav>

              {isLoggedIn && (
                <div className="mt-auto p-4 border-t">
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" /> Logout ({user?.username})
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>

          <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)} aria-label="Menu">
            <Menu className="w-5 h-5" />
          </Button>
        </div>

      </div>
    </header>
  );
}


