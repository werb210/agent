import { API_BASE_URL } from "../config/api";

const REQUEST_TIMEOUT_MS = 10000;

function buildHeaders(headers?: HeadersInit): Headers {
  return new Headers(headers ?? {});
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = process.env.API_TOKEN || process.env.AGENT_API_TOKEN;

  if (!token) {
    throw new Error("NO API TOKEN — AUTH FLOW BROKEN");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = buildHeaders(options.headers);

    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`[API ERROR] ${response.status} ${text}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}
