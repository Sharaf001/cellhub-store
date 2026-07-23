import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { getCurrentUser, removeToken, AuthUser } from "@/lib/auth";

type AuthContextType = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  logout: () => void;
  refreshAuth: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  const refreshAuth = useCallback(() => {
    setUser(getCurrentUser());
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
