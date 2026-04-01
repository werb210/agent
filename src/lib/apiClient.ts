const API_BASE =
  process.env.NODE_ENV === "test"
    ? "" // DO NOT prefix in tests (your smoke test expects raw path)
    : process.env.SERVER_URL ||
      process.env.API_BASE ||
      "http://localhost:3000";

export async function apiRequest(path: string, options: RequestInit = {}) {
  // STRICT PATH VALIDATION
  if (
    !path.startsWith("/api/") ||
    path.includes("..") ||
    path.includes("//")
  ) {
    throw new Error("[INVALID PATH]");
  }

  const fetchFn = globalThis.fetch as typeof fetch;
  if (!fetchFn) {
    throw new Error("[INVALID PATH]");
  }

  // TOKEN HANDLING
  let token: string | null = null;
  try {
    token = globalThis.localStorage?.getItem("token") ?? null;
  } catch {}

  if (!token || token === "undefined" || token === "null" || token === "") {
    throw new Error("[AUTH BLOCK]");
  }

  // FORCE AUTH HEADER (IGNORE CALLER OVERRIDE)
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  delete finalHeaders.Authorization;
  finalHeaders.Authorization = `Bearer ${token}`;

  const res = await fetchFn(`${API_BASE}${path}`, {
    ...options,
    headers: finalHeaders,
  });

  // 401 HANDLING
  if (res.status === 401) {
    try {
      globalThis.localStorage?.removeItem("token");
    } catch {}
    throw new Error("[AUTH FAIL]");
  }

  // 204 HANDLING
  if (res.status === 204) {
    return null;
  }

  // NON-OK
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API request failed: ${res.status}`);
  }

  // SAFE JSON PARSE
  try {
    return await res.json();
  } catch (err) {
    throw err;
  }
}
