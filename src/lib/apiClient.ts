import { API_BASE_URL } from "../config/api";
import { getTokenOrFail } from "./token";

const REQUEST_TIMEOUT_MS = 10000;

export async function apiClient(path: string, options: RequestInit = {}) {
  if (!path.startsWith("/api/")) {
    throw new Error(`INVALID API PATH: ${path}`);
  }

  const token = getTokenOrFail();
  console.log("[TOKEN]", token.slice(0, 12));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      },
      signal: options.signal ?? controller.signal
    });

    console.log("[REQ]", options.method || "GET", path);

    if (response.status === 401) {
      console.error("[401] AUTH FAILURE");
      throw new Error("UNAUTHORIZED");
    }

    if (!response.ok) {
      const text = await response.text();
      console.error("[API ERROR]", response.status, text);
      throw new Error("API FAILED");
    }

    const data = await response.json();

    if (!data) {
      throw new Error("EMPTY RESPONSE");
    }

    return data;
  } catch (err) {
    console.error("[NETWORK ERROR]", err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export const apiRequest = apiClient;
