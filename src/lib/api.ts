import axios, { AxiosError, AxiosRequestConfig, Method } from "axios";
import { assertApiResponse, ApiResponseEnvelope } from "./assertApiResponse";

const BASE_URL = "https://server.boreal.financial";

if (!process.env.AGENT_API_TOKEN) {
  throw new Error("Missing AGENT_API_TOKEN");
}

const api = axios.create({
  baseURL: BASE_URL
});

api.interceptors.request.use((config) => {
  if (config.headers && typeof (config.headers as any).set === "function") {
    (config.headers as any).set("Authorization", `Bearer ${process.env.AGENT_API_TOKEN}`);
  } else {
    config.headers = (config.headers || {}) as any;
    (config.headers as any).Authorization = `Bearer ${process.env.AGENT_API_TOKEN}`;
  }

  return config;
});

export async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
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
    } catch (err) {
      if (axios.isAxiosError(err) && isRetryable(requestConfig, err)) {
        throw err;
      }

      throw err;
    }
  });
}
