import { z } from "zod";

const schema = z.object({
  API_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  if (!process.env.API_URL) {
    throw new Error("API_URL missing");
  }
  cached = schema.parse(process.env);
  return cached;
}
