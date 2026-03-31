import { logger } from "../infrastructure/logger";
import { assertApiResponse, ApiResponseEnvelope } from "../lib/assertApiResponse";
import { apiRequest } from "../lib/apiClient";
import { withRetry } from "../lib/retry";

type Primitive = string | number | boolean | null | undefined;
type RequestPayload = Primitive | Record<string, unknown> | Array<unknown>;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

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

export async function bfServerRequest(path: string, method: HttpMethod, body?: RequestPayload): Promise<any> {
  const logMeta = { path, method };

  logger.info("api_call_start", logMeta);

  try {
    const data = await withRetry(async () => {
      const normalizedMethod = method.toUpperCase() as HttpMethod;
      const endpoint = normalizedMethod === "GET" && body && typeof body === "object"
        ? `${path}${toQueryString(body as Record<string, unknown>)}`
        : path;

      const headers = new Headers();
      let payload: BodyInit | undefined;

      if (normalizedMethod !== "GET" && typeof body !== "undefined") {
        headers.set("Content-Type", "application/json");
        payload = JSON.stringify(body);
      }

      const response = await apiRequest(endpoint, {
        method: normalizedMethod,
        headers,
        body: payload
      });

      if (!response || typeof response !== "object") {
        throw new Error("Invalid API response");
      }

      return assertApiResponse(response as ApiResponseEnvelope<any>);
    });

    logger.info("api_call_success", logMeta);
    logger.info("api_call_end", { ...logMeta, outcome: "success" });
    return data;
  } catch (err) {
    logger.error("api_call_failure", {
      ...logMeta,
      error: err instanceof Error ? err.message : String(err)
    });
    logger.info("api_call_end", { ...logMeta, outcome: "failure" });
    throw err;
  }
}
