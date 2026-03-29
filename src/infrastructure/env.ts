import { z } from "zod";

/**
 * In test environments we must NOT hard-fail imports via process.exit().
 * Jest executes code in-process; exiting kills the suite and causes worker crashes.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]),
  PORT: z.string(),
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
    REDIS_URL: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
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

function buildDevEnv() {
  return {
    NODE_ENV: rawNodeEnv,
    PORT: process.env.PORT ?? "4000",
    REDIS_URL: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "dev-sid",
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "dev-token",
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ?? "+10000000000",
    MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID ?? "dev-client-id",
    MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET ?? "dev-client-secret",
    GOOGLE_ADS_CLIENT_ID: process.env.GOOGLE_ADS_CLIENT_ID ?? "dev-google-client-id",
    GOOGLE_ADS_CLIENT_SECRET: process.env.GOOGLE_ADS_CLIENT_SECRET ?? "dev-google-client-secret",
    MAYA_GLOBAL_KILL_SWITCH: process.env.MAYA_GLOBAL_KILL_SWITCH,
    MAYA_MAX_CAMPAIGN_BUDGET: process.env.MAYA_MAX_CAMPAIGN_BUDGET,
    PUBLIC_WEBHOOK_URL: process.env.PUBLIC_WEBHOOK_URL
  };
}

let ENV: any;

if (rawNodeEnv === "test") {
  ENV = buildTestEnv();
} else {
  const source = rawNodeEnv === "production"
    ? { ...process.env, NODE_ENV: rawNodeEnv }
    : buildDevEnv();

  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    if (rawNodeEnv === "production") {
      throw new Error(`Missing required environment variables: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
    }

    console.warn("[ENV WARNING] Missing variables in non-production, applying development defaults");
    ENV = envSchema.parse(buildDevEnv());
  } else {
    ENV = parsed.data;
  }
}

export { ENV };
