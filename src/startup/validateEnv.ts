export type EnvState = "valid" | "degraded";

export interface EnvValidationStatus {
  state: EnvState;
  required: {
    ok: boolean;
    missing: string[];
  };
  optional: {
    present: string[];
    missing: string[];
  };
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
  const presentOptional = OPTIONAL_ENV_VARS.filter((key) => Boolean(env[key]));
  const missingOptional = OPTIONAL_ENV_VARS.filter((key) => !env[key]);

  const rawPort = env.PORT ?? (env.NODE_ENV === "test" ? "0" : "8080");
  const parsedPort = Number(rawPort);

  return {
    state: missingRequired.length === 0 ? "valid" : "degraded",
    required: {
      ok: missingRequired.length === 0,
      missing: missingRequired,
    },
    optional: {
      present: [...presentOptional],
      missing: [...missingOptional],
    },
    values: {
      port: Number.isFinite(parsedPort) ? parsedPort : 8080,
    },
  };
}
