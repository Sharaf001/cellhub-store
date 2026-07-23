import { useState } from "react";
import { useLocation } from "wouter";
import { Smartphone, Lock, User, KeyRound, LogIn, UserPlus, ShieldCheck, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { register, login, setToken } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "login" | "register";
type Role = "user" | "admin";

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("user");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refreshAuth } = useAuth();

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setAdminSecret("");
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let result;
      if (mode === "register") {
        result = await register(username, password, role, role === "admin" ? adminSecret : undefined);
        toast({
          title: "Account created!",
          description: `Welcome, ${result.user.username}! You are registered as ${result.user.isAdmin ? "Admin" : "User"}.`,
        });
      } else {
        result = await login(username, password);
        toast({
          title: "Signed in!",
          description: `Welcome back, ${result.user.username}.`,
        });
      }
      setToken(result.token);
      refreshAuth();
      setLocation(result.user.isAdmin ? "/admin" : "/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({
        title: mode === "register" ? "Registration failed" : "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-muted/10 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex items-center gap-2 text-primary font-bold text-2xl">
            <Smartphone className="w-7 h-7" />
            <span>CellHub</span>
          </div>
          <p className="text-muted-foreground text-sm">Sign in to your account</p>
        </div>

        <div className="bg-card border rounded-xl shadow-sm p-6 space-y-5">
          {/* Login / Register tabs */}
          <div className="flex rounded-lg bg-muted p-1 gap-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-1.5 rounded-md transition-all ${mode === "login" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-1.5 rounded-md transition-all ${mode === "register" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <UserPlus className="w-4 h-4" />
              Register
            </button>
          </div>

          {/* Role selector — only shown on Register */}
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label>Account Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-all ${
                    role === "user"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  <UserCircle className="w-6 h-6" />
                  User
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-all ${
                    role === "admin"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  <ShieldCheck className="w-6 h-6" />
                  Admin
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9"
                  required
                  minLength={mode === "register" ? 3 : 1}
                  autoComplete="username"
                />
              </div>
              {mode === "register" && (
                <p className="text-xs text-muted-foreground">Minimum 3 characters</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                  minLength={mode === "register" ? 6 : 1}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
              </div>
              {mode === "register" && (
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
              )}
            </div>

            {mode === "register" && role === "admin" && (
              <div className="space-y-1.5">
                <Label htmlFor="adminSecret">Admin Registration Code</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="adminSecret"
                    type="password"
                    placeholder="Enter admin code"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Default code: <code className="bg-muted px-1 rounded">cellhub-admin-2024</code>
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? mode === "register"
                  ? "Creating account..."
                  : "Signing in..."
                : mode === "register"
                  ? `Create ${role === "admin" ? "Admin" : "User"} Account`
                  : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
