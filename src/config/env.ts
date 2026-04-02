import { z } from "zod";

const schema = z.object({
  API_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]),
});

let cached: z.infer<typeof schema> | null = null;

export function getEnv() {
  if (!cached) {
    const isTest = process.env.NODE_ENV === "test";

    cached = schema.parse({
      API_URL:
        process.env.API_URL || (isTest ? "http://localhost:3000" : undefined),
      NODE_ENV: process.env.NODE_ENV || "development",
    });
  }

  return cached;
}
