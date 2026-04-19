import { getEnv } from "./config/env.js";

export function getApiUrl() {
  const { API_URL } = getEnv();
  return API_URL;
}
