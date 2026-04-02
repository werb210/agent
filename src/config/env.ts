export type Env = {
  API_URL: string;
  JWT_STORAGE_KEY: string;
};

let cachedEnv: Env | null = null;

export function resetEnv() {
  cachedEnv = null;
}

export function getEnv(): Env {
  if (!cachedEnv) {
    const apiUrl =
      process.env.API_URL ||
      (process.env.NODE_ENV === "test" ? "http://localhost:3000" : undefined);

    if (!apiUrl) {
      throw new Error("Missing API_URL");
    }

    cachedEnv = {
      API_URL: apiUrl,
      JWT_STORAGE_KEY: process.env.JWT_STORAGE_KEY || "bf_jwt_token",
    };
  }

  return cachedEnv;
}

export const env = getEnv();
