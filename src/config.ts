import { getEnv } from "./config/env";

export function getApiUrl() {
  const { API_URL } = getEnv();
  return API_URL;
}
