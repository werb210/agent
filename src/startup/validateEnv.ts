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

const REQUIRED_ENV_VARS = ["PORT", "SERVER_URL", "JWT_SECRET", "OPENAI_API_KEY"] as const;

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
  if (env.NODE_ENV === "production") {
    const required = [
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_PHONE_NUMBER",
      "OPENAI_API_KEY",
      "JWT_SECRET",
    ] as const;

    // AGENT_BLOCK_v86_ENV_DEGRADE_NOT_CRASH_v1 — previously threw on any
    // missing prod var, crash-looping the whole service (health endpoint dead
    // too). Warn so Maya boots in degraded mode and the portal health badge
    // surfaces the gap, matching validateProductionEnv + OPTIONAL_ENV_VARS.
    for (const key of required) {
      if (!env[key]) {
        console.warn(
          `[WARN] Missing production env var: ${key}. ` +
            `Maya will start in degraded mode. ` +
            `Set it in Azure App Service → Configuration.`,
        );
      }
    }

    if (!env.AGENT_SHARED_SECRET) {
      console.warn(
        "[WARN] AGENT_SHARED_SECRET is not set. " +
          "Authenticated agent→server calls will fail. " +
          "Set this in Azure App Service → Configuration to match BF-Server JWT_SECRET.",
      );
    }
  }

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
