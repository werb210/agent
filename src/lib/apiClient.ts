export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

// Prevent accidental object-style argument usage.
function assertMethod(method: unknown): asserts method is ApiMethod {
  if (typeof method !== "string") {
    throw new Error("Invalid API method usage");
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  method: ApiMethod = "GET",
  body?: unknown
): Promise<T> {
  if (!path.startsWith("/api/") || path.includes("..") || path.includes("//")) {
    throw new Error("[INVALID PATH]");
  }

  assertMethod(method);

  const token = globalThis.localStorage?.getItem("token");
  if (!token || token === "undefined" || token === "null") {
    throw new Error("[AUTH BLOCK]");
  }

  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401) {
    globalThis.localStorage?.removeItem("token");
    throw new Error("[AUTH FAIL]");
  }

  if (!res.ok) {
    throw new Error("Invalid API response");
  }

  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}
