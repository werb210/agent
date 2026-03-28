import axios, { AxiosError, AxiosRequestConfig, Method } from "axios";
import { apiConfig } from "../config/apiConfig";
import { assertApiResponse, ApiResponseEnvelope } from "./assertApiResponse";

const api = axios.create({
  baseURL: apiConfig.baseUrl
});

api.interceptors.request.use((config) => {
  if (config.headers && typeof (config.headers as any).set === "function") {
    (config.headers as any).set("Authorization", `Bearer ${apiConfig.token}`);
  } else {
    config.headers = (config.headers || {}) as any;
    (config.headers as any).Authorization = `Bearer ${apiConfig.token}`;
  }

  return config;
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  const { maxAttempts, baseDelayMs } = apiConfig.retry;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        break;
      }

      const backoffMs = baseDelayMs * 2 ** (attempt - 1);
      await sleep(backoffMs);
    }
  }

  throw lastError;
}

function isRetryable(config: AxiosRequestConfig | undefined, err: AxiosError): boolean {
  if (!config) {
    return false;
  }

  const method = String(config.method ?? "GET").toUpperCase();
  const status = err.response?.status;
  const isRetryableMethod = ["GET", "HEAD", "OPTIONS"].includes(method);
  const isRetryableStatus = typeof status === "number" && status >= 500;

  return isRetryableMethod || isRetryableStatus;
}

export async function apiRequest<T = unknown>(
  path: string,
  method: Method,
  body?: unknown,
  config: AxiosRequestConfig = {}
): Promise<T> {
  return withRetry(async () => {
    const requestConfig: AxiosRequestConfig = {
      ...config,
      url: path,
      method
    };

    if (method.toUpperCase() === "GET") {
      requestConfig.params = body as Record<string, unknown> | undefined;
    } else if (typeof body !== "undefined") {
      requestConfig.data = body;
    }

    try {
      const response = await api.request<ApiResponseEnvelope<T>>(requestConfig);
      return assertApiResponse<T>(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && isRetryable(requestConfig, error)) {
        throw error;
      }

      throw error;
    }
  });
}
