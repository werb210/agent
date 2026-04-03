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
  const base = process.env.API_BASE_URL || ENV.API_BASE_URL;

  const token = process.env.AGENT_TOKEN || "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      typeof json === "object" && json !== null && "error" in json
        ? String((json as { error?: unknown }).error || "API error")
        : "API error"
    );
  }

  if (json && typeof json === "object" && "data" in json) {
    return (json as { data: unknown }).data;
  }

  return json;
}
