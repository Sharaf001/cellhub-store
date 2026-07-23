import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, User, Lock, Mail } from "lucide-react";

type MeInfo = {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
};

export default function Account() {
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();

  const [me, setMe] = useState<MeInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    const token = getToken();
    fetch("/api/auth/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setMe(data))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      toast({ title: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Failed to change password", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-muted/10">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
          <div className="bg-card rounded-2xl border p-16 flex flex-col items-center text-center shadow-sm">
            <h2 className="text-2xl font-bold mb-3">Please log in</h2>
            <p className="text-muted-foreground max-w-md mb-8">You need to be logged in to view your account.</p>
            <Link href="/login"><Button size="lg">Log In</Button></Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/10">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12 max-w-2xl space-y-6 sm:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Account Center</h1>

        {me?.isAdmin && (
          <div className="bg-card border rounded-xl shadow-sm p-5 sm:p-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold">Admin Panel</div>
                <div className="text-sm text-muted-foreground">Manage products and orders</div>
              </div>
            </div>
            <Link href="/admin">
              <Button variant="outline">Open Admin Panel</Button>
            </Link>
          </div>
        )}

        <div className="bg-card border rounded-xl shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold text-lg">Account Info</h2>
          </div>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-3">
                <span className="text-muted-foreground">Username</span>
                <span className="font-medium">{me?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</span>
                <span className="font-medium">{me?.email}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-card border rounded-xl shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold text-lg">Change Password</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Leave blank if you signed up with Google"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
