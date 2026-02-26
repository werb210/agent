import { z } from "zod";

/**
 * In test environments we must NOT hard-fail imports via process.exit().
 * Jest executes code in-process; exiting kills the suite and causes worker crashes.
 */
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

export type Env = z.infer<typeof envSchema>;

const rawNodeEnv = process.env.NODE_ENV ?? "development";

function buildTestEnv(): any {
  return {
    NODE_ENV: "test",
    PORT: process.env.PORT ?? "0",
    DATABASE_URL: process.env.DATABASE_URL ?? "postgres://test:test@localhost:5432/test",
    REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "test",
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "test",
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ?? "+10000000000",
    MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID ?? "test",
    MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET ?? "test",
    GOOGLE_ADS_CLIENT_ID: process.env.GOOGLE_ADS_CLIENT_ID ?? "test",
    GOOGLE_ADS_CLIENT_SECRET: process.env.GOOGLE_ADS_CLIENT_SECRET ?? "test",
    MAYA_GLOBAL_KILL_SWITCH: process.env.MAYA_GLOBAL_KILL_SWITCH,
    MAYA_MAX_CAMPAIGN_BUDGET: process.env.MAYA_MAX_CAMPAIGN_BUDGET,
    PUBLIC_WEBHOOK_URL: process.env.PUBLIC_WEBHOOK_URL
  };
}

let ENV: any;

if (rawNodeEnv === "test") {
  ENV = buildTestEnv();
} else {
  const parsed = envSchema.safeParse({
    ...process.env,
    NODE_ENV: rawNodeEnv
  });

  if (!parsed.success) {
    console.error("❌ Missing required environment variables");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  ENV = parsed.data;
}

export { ENV };
