import { getEnv } from "../config/env";

export const env = getEnv();

export function validateEnv() {
  if (!env.API_URL) throw new Error("MISSING_API_URL");
  return env;
}
