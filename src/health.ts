import OpenAI from "openai";
import { areToolHandlersLoaded } from "./ai/toolExecutor";
import { pool } from "./db";

const REQUIRED_ENV_VARS = [
  "OPENAI_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "REDIS_URL"
] as const;

function validateRequiredEnvVars(): void {
  const missing = REQUIRED_ENV_VARS.filter((name) => {
    const value = process.env[name];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

function validateServiceInitialization(): void {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL is required");
  }

  try {
    const parsed = new URL(redisUrl);

    if (!parsed.protocol.startsWith("redis")) {
      throw new Error("REDIS_URL must use redis:// or rediss:// protocol");
    }
  } catch (err) {
    throw new Error(`REDIS_URL is not a valid URL: ${(err as Error).message}`);
  }
}

async function validateDbConnection(): Promise<void> {
  if (typeof pool.connect !== "function" || typeof pool.query !== "function") {
    throw new Error("Database client is not initialized");
  }
  await pool.connect();
}

function validateHandlersLoaded(): void {
  if (!areToolHandlersLoaded()) {
    throw new Error("Required handlers are not loaded");
  }
}

function validateRequiredClientsInitialized(): void {
  const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const twilioClientReady =
    typeof process.env.TWILIO_ACCOUNT_SID === "string" &&
    process.env.TWILIO_ACCOUNT_SID.length > 0 &&
    typeof process.env.TWILIO_AUTH_TOKEN === "string" &&
    process.env.TWILIO_AUTH_TOKEN.length > 0;

  if (!openaiClient || !twilioClientReady) {
    throw new Error("Required clients are not initialized");
  }
}

export async function checkHealth(): Promise<{ status: "ok" }> {
  validateRequiredEnvVars();
  validateServiceInitialization();
  await validateDbConnection();
  validateHandlersLoaded();
  validateRequiredClientsInitialized();
  return { status: "ok" };
}

export async function cleanupResources(): Promise<void> {
  return Promise.resolve();
}
