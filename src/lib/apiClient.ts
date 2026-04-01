import { getTokenOrFail } from "../services/token";

export async function apiRequest(path: string, options: RequestInit = {}) {
  if (!/^(?!.*\/\/)(?!.*\.\.)\/api\/[a-zA-Z0-9/_-]+$/.test(path)) {
    throw new Error("[INVALID PATH]");
  }

  const token = getTokenOrFail();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  const response = await globalThis["fetch"](path, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("[AUTH FAIL]");
  }

  if (!response.ok) {
    throw new Error(`[API ERROR] ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    throw new Error("[EMPTY RESPONSE]");
  }

  return JSON.parse(text);
}

export const apiClient = apiRequest;
