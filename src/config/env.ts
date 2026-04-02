import { z } from "zod";

const schema = z.object({
  API_URL: z.string().url(),
});

let cached: z.infer<typeof schema> | null = null;

export function getEnv() {
  if (!cached) {
    cached = schema.parse({
      API_URL:
        process.env.API_URL ||
        (process.env.NODE_ENV === "test"
          ? "http://localhost:3000"
          : undefined),
    });
  }
  return cached;
}
