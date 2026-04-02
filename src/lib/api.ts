import { env } from "../config/env";

export async function apiFetch(path: string, options: any = {}) {
  const authToken =
    process.env.JWT_TOKEN || process.env.AGENT_API_TOKEN || env.JWT_TOKEN;

  const res = await fetch(`${env.API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
  });

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
