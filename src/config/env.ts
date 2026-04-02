type Env = {
  API_URL: string;
  JWT_TOKEN?: string;
};

if (!process.env.API_URL) {
  throw new Error("Missing API_URL");
}

export const env: Env = {
  API_URL: process.env.API_URL,
  JWT_TOKEN: process.env.JWT_TOKEN,
};

export function getEnv(): Env {
  return env;
}

export function resetEnv() {
  // no-op: env is eagerly validated and immutable for process lifetime
}
