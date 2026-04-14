function fromEnv(key: string, fallback: string): string {
  const value = process.env[key];
  if (value && value.trim().length > 0) {
    return value;
  }

  if (process.env.NODE_ENV === "test") {
    return fallback;
  }

  return "";
}

export const ENV = {
  PORT: process.env.PORT || "8080",
  BASE_URL: process.env.BASE_URL || "http://localhost:8080",
  SERVER_URL: process.env.SERVER_URL || "http://localhost:8080",
  WS_URL:
    process.env.WS_URL || process.env.BASE_URL || "http://localhost:8080",
  AGENT_API_TOKEN: fromEnv("AGENT_API_TOKEN", "test_token"),
  JWT_SECRET: fromEnv("JWT_SECRET", "test_secret"),
  TWILIO_ACCOUNT_SID: fromEnv("TWILIO_ACCOUNT_SID", "test_sid"),
  TWILIO_AUTH_TOKEN: fromEnv("TWILIO_AUTH_TOKEN", "test_auth_token"),
  TWILIO_PHONE_NUMBER: fromEnv("TWILIO_PHONE_NUMBER", "+15555550123"),
  OPENAI_API_KEY: fromEnv("OPENAI_API_KEY", "test_key"),
};

const env = {
  API_URL: ENV.BASE_URL,
  JWT_TOKEN: process.env.JWT_TOKEN,
};

export function getEnv() {
  return env;
}

export function resetEnv() {
  // no-op: env is eagerly validated and immutable for process lifetime
}
