import { getEnv } from "../config/env";

export function validateEnv() {
  const env = getEnv();
  if (!env.API_URL) throw new Error("MISSING_API_URL");
  if (!env.NODE_ENV) throw new Error("MISSING_NODE_ENV");
}
