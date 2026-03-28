import axios, { AxiosRequestConfig, Method } from "axios";
import { apiConfig } from "../config/apiConfig";
import { assertApiResponse, ApiResponseEnvelope } from "./assertApiResponse";
import { withRetry } from "./retry";

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

    const response = await api.request<ApiResponseEnvelope<T>>(requestConfig);

    if (!response || typeof response !== "object") {
      throw new Error("Invalid API response");
    }

    return assertApiResponse<T>(response.data);
  });
}
