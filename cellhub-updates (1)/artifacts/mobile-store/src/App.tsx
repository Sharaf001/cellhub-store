import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Admin from "@/pages/Admin";
import Login from "@/pages/Login";
import Account from "@/pages/Account";
import { getToken, fetchMe } from "@/lib/auth";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

function ProtectedAdmin() {
  const [, setLocation] = useLocation();
  const [checked, setChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLocation("/login");
      return;
    }
    fetchMe().then((user) => {
      if (user?.isAdmin) {
        setAuthorized(true);
      } else {
        setLocation("/login");
      }
      setChecked(true);
    });
  }, []);

  if (!checked) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Checking authentication...</span>
      </div>
    );
  }

  return authorized ? <Admin /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/login" component={Login} />
      <Route path="/account" component={Account} />
      <Route path="/admin" component={ProtectedAdmin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
