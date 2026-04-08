export type EnvMode = "valid" | "degraded";

export interface EnvValidationStatus {
  valid: boolean;
  missingRequired: string[];
  missingOptional: string[];
  mode: EnvMode;
  values: {
    port: number;
  };
}

const REQUIRED_ENV_VARS = ["PORT"] as const;

const OPTIONAL_ENV_VARS = [
  "OPENAI_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "REDIS_URL",
  "DATABASE_URL",
  "EXTERNAL_API_BASE_URL",
] as const;

export function validateEnv(env: NodeJS.ProcessEnv = process.env): EnvValidationStatus {
  const missingRequired = REQUIRED_ENV_VARS.filter((key) => !env[key]);
  const missingOptional = OPTIONAL_ENV_VARS.filter((key) => !env[key]);
  const valid = missingRequired.length === 0;

  const fallbackPort = env.NODE_ENV === "test" ? "0" : "8080";
  const rawPort = env.PORT ?? fallbackPort;
  const parsedPort = Number(rawPort);

  return {
    valid,
    missingRequired,
    missingOptional,
    mode: valid ? "valid" : "degraded",
    values: {
      port: Number.isFinite(parsedPort) ? parsedPort : Number(fallbackPort),
    },
  };
}
