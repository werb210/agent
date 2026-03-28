import axios, { AxiosError } from "axios";

const BASE_URL = "https://server.boreal.financial";

const api = axios.create({
  baseURL: BASE_URL
});

api.interceptors.request.use((config) => {
  const token = process.env.AGENT_API_TOKEN;

  if (!token) {
    throw new Error("Missing AGENT_API_TOKEN");
  }

  if (config.headers && typeof (config.headers as any).set === "function") {
    (config.headers as any).set("Authorization", `Bearer ${token}`);
  } else {
    config.headers = (config.headers || {}) as any;
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config;

  if (!config) {
    throw error;
  }

  const retryCount = Number((config as any).__retryCount ?? 0);
  const method = String(config.method ?? "GET").toUpperCase();
  const status = error.response?.status;
  const isRetryableMethod = ["GET", "HEAD", "OPTIONS"].includes(method);
  const isRetryableStatus = typeof status === "number" && status >= 500;

  if (retryCount >= 2 || (!isRetryableMethod && !isRetryableStatus)) {
    throw error;
  }

  (config as any).__retryCount = retryCount + 1;
  return api.request(config);
});

export default api;
