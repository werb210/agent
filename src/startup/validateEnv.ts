const REQUIRED_ENV_VARS = ["OPENAI_API_KEY", "BF_SERVER_API", "MAYA_SECRET"] as const;

export function validateEnv(): void {
  REQUIRED_ENV_VARS.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });
}
