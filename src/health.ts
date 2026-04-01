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

export async function checkHealth(): Promise<{ status: "ok" }> {
  validateRequiredEnvVars();
  validateServiceInitialization();
  return { status: "ok" };
}
