import { getEnv } from "../config/env";

export function validateEnv() {
  const env = getEnv();

  if (!env.API_URL) throw new Error("MISSING_API_URL");
  return env;
}
