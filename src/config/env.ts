import { z } from "zod";

const schema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  API_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]),
});

let cached: z.infer<typeof schema> | null = null;

export function getEnv() {
  if (!cached) {
    const raw = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      API_URL:
        process.env.API_URL ||
        (process.env.NODE_ENV === "test"
          ? "http://localhost:3000"
          : undefined),
      NODE_ENV: process.env.NODE_ENV || "development",
    };

    cached = schema.parse(raw);
  }
  return cached;
}
