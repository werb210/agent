import { getEnv } from "../config/env";

export function validateEnv() {
  const env = getEnv();
  if (!process.env.API_BASE_URL) {
    throw new Error("API_BASE_URL is required");
  }

  if (!process.env.AGENT_API_TOKEN) {
    console.warn("AGENT_API_TOKEN not set — some features may fail");
  }

  return env;
}
