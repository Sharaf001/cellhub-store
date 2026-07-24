const TOKEN_KEY = "cellhub_token";
export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}
export function removeToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}
export function isAuthenticated(): boolean {
  return !!getToken();
}
export const API_BASE = `${import.meta.env.VITE_API_URL || ""}/api`;
export type AuthUser = { id: number; username: string; isAdmin: boolean };
export type AuthResult = { token: string; user: AuthUser };
export async function register(
  username: string,
  email: string,
  password: string,
  role: "user" | "admin",
  adminSecret?: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password, role, adminSecret }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data as { message: string };
}
export async function login(username: string, password: string): Promise<AuthResult> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data as AuthResult;
}
export async function verifyEmail(token: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/verify?token=${encodeURIComponent(token)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Verification failed");
  return data as { message: string };
}
export async function fetchMe(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<AuthUser>;
}
export function parseToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.id,
      username: payload.username,
      isAdmin: payload.isAdmin ?? false,
    };
  } catch {
    return null;
  }
}
export function getCurrentUser(): AuthUser | null {
  const token = getToken();
  if (!token) return null;
  return parseToken(token);
}

