import { getAgentToken } from "./env";

export const apiConfig = {
  baseUrl: "https://server.boreal.financial",
  token: getAgentToken()
} as const;
