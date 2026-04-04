const required = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'OPENAI_API_KEY',
  'BASE_URL',
  'API_BASE_URL',
];

if (process.env.NODE_ENV !== 'test') {
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  if (!process.env.AGENT_API_TOKEN) {
throw new Error("Missing AGENT_API_TOKEN");
  }
}

export const ENV = {
  PORT: process.env.PORT || '8080',
  BASE_URL: process.env.BASE_URL || 'http://localhost:8080',
  API_BASE_URL:
    process.env.API_BASE_URL || process.env.AGENT_API_BASE_URL || '',
  WS_URL:
    process.env.WS_URL ||
    process.env.BASE_URL ||
    process.env.API_BASE_URL ||
    process.env.AGENT_API_BASE_URL ||
    'http://localhost:8080',
  AGENT_API_TOKEN: process.env.AGENT_API_TOKEN || 'test_token',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || 'test_sid',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || 'test_auth_token',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '+15555550123',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'test_key',
};

const env = {
  API_URL: ENV.API_BASE_URL,
  JWT_TOKEN: process.env.JWT_TOKEN,
};

export function getEnv() {
  return env;
}

export function resetEnv() {
  // no-op: env is eagerly validated and immutable for process lifetime
}
