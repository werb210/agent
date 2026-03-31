import { enforceStartupAuth } from "../app/bootstrap";
import { assertApiResponse, ApiResponseEnvelope } from "./assertApiResponse";
import { apiRequest as baseApiRequest } from "./apiClient";
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

enforceStartupAuth();

export async function apiRequest<T = unknown>(
  path: string,
  method: string,
  body?: unknown,
  config: { headers?: HeadersInit } = {}
): Promise<T> {
  return withRetry(async () => {
    const normalizedMethod = method.toUpperCase();
    const endpoint = normalizedMethod === "GET" && body && typeof body === "object"
      ? `${path}${toQueryString(body as Record<string, unknown>)}`
      : path;

    const headers = new Headers(config.headers ?? {});
    let payload: BodyInit | undefined;

    if (normalizedMethod !== "GET" && typeof body !== "undefined") {
      headers.set("Content-Type", "application/json");
      payload = JSON.stringify(body);
    }

    const data = await baseApiRequest(endpoint, {
      method: normalizedMethod,
      headers,
      body: payload
    });

    if (!data || typeof data !== "object") {
      throw new Error("Invalid API response");
    }

    return assertApiResponse<T>(data as ApiResponseEnvelope<T>);
  });
}
