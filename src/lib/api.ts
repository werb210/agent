import { apiRequest as baseApiRequest, type ApiMethod } from "./apiClient";
import { withRetry } from "./retry";

function toQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "undefined" || value === null) {
      continue;
    }

    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function apiRequest<T = unknown>(
  path: string,
  method: ApiMethod,
  body?: unknown,
  _config: { headers?: HeadersInit } = {}
): Promise<T> {
  void _config;
  return withRetry(async () => {
    const normalizedMethod = method;
    const endpoint = normalizedMethod === "GET" && body && typeof body === "object"
      ? `${path}${toQueryString(body as Record<string, unknown>)}`
      : path;
    const payload = normalizedMethod === "GET" ? undefined : body;
    const data = await baseApiRequest(endpoint, normalizedMethod, payload);

    if (!data || typeof data !== "object") {
      throw new Error("Invalid API response");
    }

    return data as T;
  });
}
