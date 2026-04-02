import { getEnv } from "./env";

export function getApiBase() {
  const { API_URL } = getEnv();
  return `${API_URL}/api/v1`;
}
