import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  AGENT_API_TOKEN: z.string().min(1),
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
