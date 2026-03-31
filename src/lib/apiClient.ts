import { clearToken, getTokenOrFail } from "../services/token";

export async function apiRequest(path: string, options: RequestInit = {}) {
  if (!path.startsWith("/api/")) {
    throw new Error("[INVALID API FORMAT]");
  }

  const token = getTokenOrFail();

  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    clearToken();
    const browserWindow = (globalThis as { window?: { location?: { href: string } } }).window;
    if (browserWindow?.location) {
      browserWindow.location.href = "/login";
    }
    throw new Error("[AUTH FAIL]");
  }

  if (!response.ok) {
    throw new Error(`[API ERROR] ${response.status}`);
  }

  const text = await response.text();

  if (!text) {
    throw new Error("[EMPTY RESPONSE]");
  }

  return JSON.parse(text);
}

export const apiClient = apiRequest;
