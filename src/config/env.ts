const REQUIRED_ENV_VARS = ["BASE_URL", "SERVER_URL"];
const REQUIRED_RUNTIME = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "OPENAI_API_KEY",
  "AGENT_API_TOKEN",
];

if (process.env.NODE_ENV !== "test") {
  for (const key of [...REQUIRED_ENV_VARS, ...REQUIRED_RUNTIME]) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
}

export const ENV = {
  PORT: process.env.PORT || "8080",
  BASE_URL: process.env.BASE_URL || "http://localhost:8080",
  SERVER_URL: process.env.SERVER_URL || "http://localhost:8080",
  WS_URL:
    process.env.WS_URL || process.env.BASE_URL || "http://localhost:8080",
  AGENT_API_TOKEN: process.env.AGENT_API_TOKEN || "test_token",
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "test_sid",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "test_auth_token",
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || "+15555550123",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "test_key",
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
