import { apiFetch } from "./apiClient";

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export async function apiRequest<T = unknown>(
  path: string,
  method: ApiMethod,
  body?: unknown,
  config: { headers?: HeadersInit } = {}
): Promise<T> {
  const data = await apiFetch(path, {
    method,
    headers: config.headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  return data as T;
}
