import { env } from "../config/env";

export function validateEnv() {
  if (!env.API_URL) throw new Error("MISSING_API_URL");
  if (!env.NODE_ENV) throw new Error("MISSING_NODE_ENV");
}
