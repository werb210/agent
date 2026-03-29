import { z } from "zod";

export const SAFE_FALLBACKS = {
  OPENAI_API_KEY: "dev-key",
  TWILIO_ACCOUNT_SID: "dev-sid",
  TWILIO_AUTH_TOKEN: "dev-token",
  REDIS_URL: "redis://localhost:6379"
} as const;

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  REDIS_URL: z.string().min(1)
});

const envWithFallbacks = {
  ...process.env,
  ...((process.env.NODE_ENV === "production" ? {} : SAFE_FALLBACKS) as Record<string, string>)
};

const parsed = envSchema.safeParse(envWithFallbacks);

if (!parsed.success) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(`Environment validation failed: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
  } else {
    console.warn("Missing env var, using safe fallback");
  }
}

export const ENV = parsed.success
  ? parsed.data
  : envSchema.parse({
      ...SAFE_FALLBACKS,
      ...process.env
    });

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
