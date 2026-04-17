import jwt from "jsonwebtoken";

function getServiceToken(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET not configured");
  }

  return jwt.sign(
    { id: "agent-service", phone: "agent", role: "Staff" },
    secret,
    { expiresIn: "1h" }
  );
}

/**
 * Browser/client-safe API wrapper used by Maya conversational intents.
 */
export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${process.env.SERVER_URL ?? "https://server.boreal.financial"}${path}`, {
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
  let token = "";
  try {
    token = getServiceToken();
  } catch {
    token = process.env.AGENT_API_TOKEN || "";
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {})
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${process.env.SERVER_URL ?? "https://server.boreal.financial"}${path}`, {
    ...options,
    headers
  });

  const json = await res.json().catch(() => ({}));
  const ok = typeof res.ok === "boolean" ? res.ok : res.status >= 200 && res.status < 300;

  if (!ok) {
    if (typeof json === "object" && json !== null && "error" in json) {
      throw new Error(String((json as { error?: unknown }).error || `API ERROR ${res.status}`));
    }
    throw new Error(`API ERROR ${res.status}`);
  }

  if (json && typeof json === "object") {
    if ("status" in json && (json as { status?: unknown }).status === "error") {
      throw new Error(String((json as { error?: unknown }).error || "API ERROR"));
    }

    if ("data" in json) {
      return (json as { data: unknown }).data;
    }
  }

  return json;
}
