export async function apiRequest(path: string, method = "GET", body?: unknown) {
  if (!path.startsWith("/api/") || path.includes("..") || path.includes("//")) {
    throw new Error("[INVALID PATH]");
  }

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

  if (res.status === 204) return null;
  return res.json();
}
