import { ENV } from "../config/env";

/**
 * Browser/client-safe API wrapper used by Maya conversational intents.
 */
export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errorMessage =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error?: unknown }).error || "API_ERROR")
        : "API_ERROR";

    throw new Error(errorMessage);
  }

  return data;
}

/**
 * Core API wrapper for agent (server-to-server)
 */
export async function apiCall(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
    Authorization: `Bearer ${ENV.API_TOKEN}`,
  };

  const res: Response = await fetch(`${ENV.API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  const status = res.status ?? 200;
  const ok = typeof res.ok === "boolean" ? res.ok : status >= 200 && status < 300;

  if (!ok) {
    throw (
      data || {
        status: "error",
        error: { message: "request_failed" },
      }
    );
  }

  return data;
}
