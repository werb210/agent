import { ENV } from "../config/env";

/**
 * Core API wrapper for agent (server-to-server)
 */
export async function apiCall(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
    Authorization: `Bearer ${ENV.API_TOKEN}`
  };

  const res = await fetch(`${ENV.API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw (
      data || {
        status: "error",
        error: { message: "request_failed" }
      }
    );
  }

  return data;
}
