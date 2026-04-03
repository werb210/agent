function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === "test") {
      const placeholder = "test-placeholder";
      process.env[name] = placeholder;
      return placeholder;
    }
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

/**
 * Canonical config
 */
export const ENV = {
  PORT: process.env.PORT || "8080",

  API_BASE_URL: process.env.API_BASE_URL || "http://localhost:8080",
  API_TOKEN: requireEnv("AGENT_API_TOKEN"),

  BASE_URL: process.env.BASE_URL || process.env.API_BASE_URL || "http://localhost:8080",
  WS_URL: process.env.WS_URL || process.env.BASE_URL || process.env.API_BASE_URL || "http://localhost:8080",

  TWILIO_ACCOUNT_SID: requireEnv("TWILIO_ACCOUNT_SID"),
  TWILIO_AUTH_TOKEN: requireEnv("TWILIO_AUTH_TOKEN"),
  TWILIO_PHONE_NUMBER: requireEnv("TWILIO_PHONE_NUMBER"),

  OPENAI_API_KEY: requireEnv("OPENAI_API_KEY")
};

/**
 * Startup validation
 */
if (!ENV.API_BASE_URL.startsWith("http")) {
  throw new Error("Invalid API_BASE_URL");
}

export const env = {
  API_URL: ENV.API_BASE_URL,
  JWT_TOKEN: process.env.JWT_TOKEN
};

export function getEnv() {
  return env;
}

export function resetEnv() {
  // no-op: env is eagerly validated and immutable for process lifetime
}
