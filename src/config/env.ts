const required = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "OPENAI_API_KEY",
  "BASE_URL"
] as const;

const isTest = process.env.NODE_ENV === "test";

for (const key of required) {
  if (!process.env[key]) {
    if (isTest) {
      process.env[key] = "test-placeholder";
    } else {
      throw new Error(`Missing required env: ${key}`);
    }
  }
}

export const ENV = {
  PORT: process.env.PORT || "8080",
  BASE_URL: process.env.BASE_URL!,
  WS_URL: process.env.WS_URL || process.env.BASE_URL!,

  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID!,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN!,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER!,

  OPENAI_API_KEY: process.env.OPENAI_API_KEY!
};

export const env = {
  API_URL: ENV.BASE_URL,
  JWT_TOKEN: process.env.JWT_TOKEN
};

export function getEnv() {
  return env;
}

export function resetEnv() {
  // no-op: env is eagerly validated and immutable for process lifetime
}
