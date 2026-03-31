import { API_BASE_URL } from "./api";
import { getAgentToken } from "./env";

export const apiConfig = {
  baseUrl: API_BASE_URL,
  token: getAgentToken()
} as const;
