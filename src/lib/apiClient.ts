import { API_BASE_URL } from "../config/api";
import { getTokenOrFail } from "./token";

const REQUEST_TIMEOUT_MS = 10000;

export async function apiRequest(path: string, options: RequestInit = {}): Promise<any> {
  if (!path.startsWith("/api/")) {
    throw new Error(`[API BLOCKED] INVALID PATH: ${path}`);
  }

  const token = getTokenOrFail();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = new Headers(options.headers ?? {});

    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    headers.delete("Authorization");
    headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal
    });

    console.log("[REQ]", options.method || "GET", path);
    console.log("[STATUS]", res.status);

    if (res.status === 401) {
      throw new Error("[AUTH FAILURE] TOKEN INVALID");
    }

    if (!res.ok) {
      throw new Error(`[API ERROR] ${res.status}`);
    }

    const text = await res.text();

    if (!text) {
      throw new Error("[API ERROR] EMPTY RESPONSE");
    }

    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}
