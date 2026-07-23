import { useLocation, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  UserCircle,
  ShieldCheck,
  ShoppingCart,
  LogOut,
  ShoppingBag,
  ArrowRight,
  Package,
} from "lucide-react";
import { useEffect } from "react";

export default function Account() {
  const { user, isLoggedIn, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/login");
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/5">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
          <p className="text-muted-foreground mt-1">Manage your profile and preferences</p>
        </div>

        <div className="space-y-4">
          <div className="bg-card border rounded-2xl p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {user.isAdmin
                ? <ShieldCheck className="w-8 h-8 text-primary" />
                : <UserCircle className="w-8 h-8 text-primary" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold truncate">{user.username}</h2>
                <Badge variant={user.isAdmin ? "default" : "secondary"} className="shrink-0">
                  {user.isAdmin ? "Admin" : "User"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">Account ID: #{user.id}</p>
            </div>
          </div>

          <div className="bg-card border rounded-2xl divide-y">
            <div className="p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Account Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Username</span>
                  <span className="font-medium">{user.username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account Type</span>
                  <span className="font-medium">{user.isAdmin ? "Administrator" : "Customer"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account ID</span>
                  <span className="font-medium">#{user.id}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-2xl divide-y">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-5 pt-5 pb-3">
              Quick Links
            </h3>
            <Link href="/cart">
              <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">My Cart</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </Link>
            <Link href="/products">
              <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Continue Shopping</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </Link>
            {user.isAdmin && (
              <Link href="/admin">
                <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">Admin Dashboard</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </Link>
            )}
          </div>

          <div className="bg-card border border-destructive/20 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Session
            </h3>
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
