import { z } from "zod";
import { ENV as nodeEnv } from "../config/env";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]),
  PORT: z.string(),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  TWILIO_ACCOUNT_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_PHONE_NUMBER: z.string(),
  MICROSOFT_CLIENT_ID: z.string(),
  MICROSOFT_CLIENT_SECRET: z.string(),
  GOOGLE_ADS_CLIENT_ID: z.string(),
  GOOGLE_ADS_CLIENT_SECRET: z.string(),
  MAYA_GLOBAL_KILL_SWITCH: z.string().optional(),
  MAYA_MAX_CAMPAIGN_BUDGET: z.string().optional(),
  PUBLIC_WEBHOOK_URL: z.string().optional()
});

const parsed = envSchema.safeParse({
  ...process.env,
  NODE_ENV: process.env.NODE_ENV ?? nodeEnv
});

if (!parsed.success) {
  console.error("❌ Missing required environment variables");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const ENV = parsed.data;
