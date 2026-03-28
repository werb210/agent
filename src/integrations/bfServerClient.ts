import { AxiosRequestConfig, Method } from "axios";
import { logger } from "../infrastructure/logger";
import { apiClient } from "../lib/apiClient";
import { withRetry } from "../lib/retry";

type Primitive = string | number | boolean | null | undefined;
type RequestPayload = Primitive | Record<string, unknown> | Array<unknown>;

export async function bfServerRequest(
  path: string,
  method: Method,
  body?: RequestPayload
) {
  const logMeta = { path, method };

  logger.info("api_call_start", logMeta);

  try {
    const data = await withRetry(async () => {
      const request: AxiosRequestConfig = {
        url: path,
        method
      };

      if (method.toUpperCase() === "GET") {
        request.params = body as Record<string, unknown> | undefined;
      } else {
        request.data = body;
      }

      const response = await apiClient.request(request);
      logger.info("api_call_success", { ...logMeta, status: response.status });
      return response.data;
    });

    logger.info("api_call_end", { ...logMeta, outcome: "success" });
    return data;
  } catch (error) {
    logger.error("api_call_failure", {
      ...logMeta,
      error: error instanceof Error ? error.message : String(error)
    });
    logger.info("api_call_end", { ...logMeta, outcome: "failure" });
    throw error;
  }
}
