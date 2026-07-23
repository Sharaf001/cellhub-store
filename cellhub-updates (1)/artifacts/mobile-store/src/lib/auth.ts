const TOKEN_KEY = "cellhub_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export type AuthUser = { id: number; username: string; isAdmin: boolean };
export type AuthResult = { token: string; user: AuthUser };

export async function register(
  username: string,
  password: string,
  role: "user" | "admin",
  adminSecret?: string
): Promise<AuthResult> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, role, adminSecret }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data as AuthResult;
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

export async function fetchMe(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<AuthUser>;
}

export async function registerAdmin(username: string, password: string, adminSecret: string): Promise<AuthResult> {
  return register(username, password, "admin", adminSecret);
}

export async function loginAdmin(username: string, password: string): Promise<AuthResult> {
  return login(username, password);
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
