import { logger } from "../infrastructure/logger";
import { apiRequest } from "../lib/api";

type Primitive = string | number | boolean | null | undefined;
type RequestPayload = Primitive | Record<string, unknown> | Array<unknown>;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export async function bfServerRequest(path: string, method: HttpMethod, body?: RequestPayload): Promise<any> {
  const logMeta = { path, method };

  logger.info("api_call_start", logMeta);

  try {
    const data = await apiRequest(path, method, body);
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
