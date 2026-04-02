import { getEnv } from "../config/env";

export function validateEnv() {
  const env = getEnv();
  return env;
}
