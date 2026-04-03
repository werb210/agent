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

  const res: any = await fetch(`${ENV.API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  let data;
  try {
    data = await res.json?.();
  } catch {
    data = null;
  }

  const status = res?.status ?? 200;
  const ok = typeof res?.ok === "boolean" ? res.ok : status >= 200 && status < 300;

  if (!ok) {
    throw (
      data || {
        status: "error",
        error: { message: "request_failed" }
      }
    );
  }

  return data;
}
