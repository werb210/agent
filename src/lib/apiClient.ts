const API_BASE =
  process.env.SERVER_URL ||
  process.env.API_BASE ||
  "http://localhost:3000"; // fallback for tests

if (!API_BASE && process.env.NODE_ENV !== "test") {
  throw new Error("Missing SERVER_URL");
}

export async function apiRequest(path: string, options: RequestInit = {}) {
  if (!path.startsWith("/api/")) {
    throw new Error("[INVALID PATH]");
  }

  const fetchFn = globalThis.fetch as typeof fetch;

  if (!fetchFn) {
    throw new Error("[INVALID PATH]");
  }

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  delete (finalHeaders as any).Authorization;

  finalHeaders["Authorization"] = "***";

  const res = await fetchFn(`${API_BASE}${path}`, {
    ...options,
    headers: finalHeaders,
  });

  if (res.status === 401) {
    try {
      globalThis.localStorage?.removeItem("token");
    } catch {}
    throw new Error("[AUTH FAIL]");
  }

  if (!res.ok) {
    const text = await res.text();
    console.error("API_ERROR", { path, status: res.status, body: text });
    throw new Error(`API request failed: ${res.status}`);
  }

  return res.json();
}
