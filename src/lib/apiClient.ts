import { clearToken, getTokenOrFail } from "../services/token";
import { API_BASE } from "../config/api";

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const status = typeof res.status === "number" ? res.status : 200;
  const ok = typeof res.ok === "boolean" ? res.ok : status >= 200 && status < 300;

  if (!ok) {
    if (status === 404) {
      throw new Error("ENDPOINT_NOT_FOUND");
    }
    throw new Error(`API error ${status}`);
  }

  return res.json();
}

export async function apiRequest<T = unknown>(
  path: string,
  method: string = "GET",
  body?: unknown
): Promise<T | null> {
  if (!path.startsWith("/api/") || path.includes("..") || path.includes("//")) {
    throw new Error("[INVALID PATH]");
  }

  const token = getTokenOrFail();

  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401) {
    clearToken();
    if ((globalThis as { window?: { location?: { href?: string } } }).window?.location) {
      (globalThis as { window: { location: { href: string } } }).window.location.href = "/login";
    }
    throw new Error("[AUTH FAIL]");
  }

  if (res.status === 204) {
    return null;
  }

  return (await res.json()) as T;
}
