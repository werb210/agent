import { env } from "../config/env";
import { apiFetch as baseApiFetch } from "../utils/apiClient";

export async function apiFetch(path: string, options: any = {}) {
  const res = await baseApiFetch(`${env.API_URL}${path}`, options);

  if (res.status === 503) {
    throw new Error("SERVICE_NOT_READY");
  }

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (res.status === 410) {
    throw new Error("ENDPOINT_DEPRECATED");
  }

  return res;
}

type ApiResponse<T> = {
  status: "ok" | "error" | "not_ready";
  data?: T;
  error?: string;
  rid?: string;
};

export async function api<T = unknown>(
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }
): Promise<T> {
  const res = await apiFetch(path, {
    method: options?.method || "GET",
    headers: options?.headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const json: ApiResponse<T> = await res.json();

  if (json.status !== "ok") {
    throw new Error(json.error || "API error");
  }

  return json.data as T;
}
