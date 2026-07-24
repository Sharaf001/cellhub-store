import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { Smartphone, Lock, User, Mail, KeyRound, LogIn, UserPlus, ShieldCheck, UserCircle, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { register, login, setToken, API_BASE } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "login" | "register";
type Role = "user" | "admin";

const GOOGLE_CLIENT_ID = "428603962922-41krvu4298aonse55mh0b42546re2bfs.apps.googleusercontent.com";

declare global {
  interface Window {
    google?: any;
  }
}

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("user");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredMessage, setRegisteredMessage] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refreshAuth } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const adminSecretRef = useRef(adminSecret);
  const roleRef = useRef(role);
  adminSecretRef.current = adminSecret;
  roleRef.current = role;

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setAdminSecret("");
    setRegisteredMessage(null);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const result = await register(username, email, password, role, role === "admin" ? adminSecret : undefined);
        setRegisteredMessage(result.message);
        toast({ title: "Account created!", description: "Check your email to verify your account." });
      } else {
        const result = await login(username, password);
        toast({
          title: "Signed in!",
          description: `Welcome back, ${result.user.username}.`,
        });
        setToken(result.token);
        refreshAuth();
        setLocation(result.user.isAdmin ? "/admin" : "/");
      }
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

  useEffect(() => {
    const handleGoogleResponse = async (response: any) => {
      try {
        const body: any = { credential: response.credential };
        if (roleRef.current === "admin" && adminSecretRef.current) {
          body.adminSecret = adminSecretRef.current;
        }
        const res = await fetch(`${API_BASE}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Google sign-in failed");
        setToken(data.token);
        refreshAuth();
        toast({ title: "Signed in!", description: `Welcome, ${data.user.username}.` });
        setLocation(data.user.isAdmin ? "/admin" : "/");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        toast({ title: "Google sign-in failed", description: message, variant: "destructive" });
      }
    };

    let cancelled = false;
    const tryInit = () => {
      if (cancelled) return;
      if (window.google?.accounts?.id && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
        });
      } else {
        setTimeout(tryInit, 200);
      }
    };
    tryInit();

    return () => {
      cancelled = true;
    };
  }, []);

  if (registeredMessage) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-muted/10 px-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="flex items-center gap-2 text-primary font-bold text-2xl">
              <Smartphone className="w-7 h-7" />
              <span>CellHub</span>
            </div>
          </div>
          <div className="bg-card border rounded-xl shadow-sm p-8 flex flex-col items-center gap-4 text-center">
            <MailCheck className="w-12 h-12 text-primary" />
            <h2 className="text-xl font-bold">Check your email</h2>
            <p className="text-muted-foreground">{registeredMessage}</p>
            <Button variant="outline" className="mt-2" onClick={() => switchMode("login")}>
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex justify-center" ref={googleButtonRef} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

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

          {mode === "register" && role === "admin" && (
            <div className="space-y-1.5">
              <Label htmlFor="adminSecretTop">Admin Registration Code</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="adminSecretTop"
                  type="password"
                  placeholder="Enter admin code"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">Required for Admin registration, including Google sign-in above.</p>
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

            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    autoComplete="email"
                  />
                </div>
                <p className="text-xs text-muted-foreground">We'll send a verification link to this address.</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
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
              {mode === "login" && (
                <div className="text-right">
                  <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

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


