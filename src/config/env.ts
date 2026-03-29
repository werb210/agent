import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  REDIS_URL: z.string().min(1)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Environment validation failed: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
}

export const ENV = parsed.data;
export const isProd = process.env.NODE_ENV === "production";
export const isStaging = process.env.NODE_ENV === "staging";
export const PORT = process.env.PORT || 5000;

export function getAgentToken() {
  const token = process.env.AGENT_API_TOKEN;

  if (!token && process.env.NODE_ENV === "production") {
    throw new Error("AGENT_API_TOKEN is required in production");
  }

  return token || "dev-token";
}
