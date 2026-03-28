import { AxiosRequestConfig, Method } from "axios";
import { logger } from "../infrastructure/logger";
import api from "../lib/api";

type Primitive = string | number | boolean | null | undefined;
type RequestPayload = Primitive | Record<string, unknown> | Array<unknown>;

type ApiEnvelope<T = any> = {
  success: boolean;
  error?: string;
  data: T;
};

export async function bfServerRequest(
  path: string,
  method: Method,
  body?: RequestPayload
): Promise<any> {
  const logMeta = { path, method };

  logger.info("api_call_start", logMeta);

  try {
    const request: AxiosRequestConfig = {
      url: path,
      method
    };

    if (method.toUpperCase() === "GET") {
      request.params = body as Record<string, unknown> | undefined;
    } else {
      request.data = body;
    }

    const response = await api.request<ApiEnvelope>(request);
    const data = response.data;

    if (!data || typeof data.success !== "boolean") {
      throw new Error("Invalid API contract");
    }

    if (!data.success) {
      throw new Error(data.error || "API request failed");
    }

    logger.info("api_call_success", { ...logMeta, status: response.status });
    logger.info("api_call_end", { ...logMeta, outcome: "success" });
    return data.data;
  } catch (error) {
    logger.error("api_call_failure", {
      ...logMeta,
      error: error instanceof Error ? error.message : String(error)
    });
    logger.info("api_call_end", { ...logMeta, outcome: "failure" });
    throw error;
  }
}
