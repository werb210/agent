import { getTokenOrFail } from "../services/token";

export async function apiRequest(path: string, options: RequestInit = {}) {
  if (!path.startsWith("/api/")) {
    throw new Error("[INVALID API PATH]");
  }

  const token = getTokenOrFail();
  const headers = {
    ...(options.headers || {})
  } as Record<string, string>;

  delete headers.Authorization;
  headers.Authorization = `Bearer ${token}`;
  headers["Content-Type"] = "application/json";

  const response = await fetch(path, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    throw new Error("[AUTH FAIL]");
  }

  if (!response.ok) {
    throw new Error(`[API ERROR] ${response.status}`);
  }

  const text = await response.text();

  if (response.status === 204) {
    return null;
  }

  if (!text) {
    throw new Error("[EMPTY RESPONSE]");
  }

  return JSON.parse(text);
}

export const apiClient = apiRequest;
