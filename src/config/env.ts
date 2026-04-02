import { z } from "zod";

const schema = z.object({
  API_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]),
});

let cachedEnv: z.infer<typeof schema> | null = null;

export function resetEnv() {
  cachedEnv = null;
}

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = schema.parse({
      NODE_ENV: process.env.NODE_ENV || "development",
      API_URL:
        process.env.API_URL ||
        (process.env.NODE_ENV === "test" ? "http://localhost:3000" : undefined),
    });
  }

  return cachedEnv;
}
