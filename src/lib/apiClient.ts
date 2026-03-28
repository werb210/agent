import axios from "axios";
import { API_BASE_URL } from "../config/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

apiClient.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers["Content-Type"] = "application/json";

  if (process.env.AGENT_API_TOKEN) {
    config.headers["Authorization"] = `Bearer ${process.env.AGENT_API_TOKEN}`;
  }

  return config;
});
