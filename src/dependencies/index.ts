import { RuntimeDependencies, type DependencyStatus } from "./types";

function available(mode: "live" | "mock", detail?: string): DependencyStatus {
  return { state: "available", mode, detail };
}

function unavailable(mode: "live" | "mock", detail?: string): DependencyStatus {
  return { state: "unavailable", mode, detail };
}

export function createDependencies(env: NodeJS.ProcessEnv = process.env): RuntimeDependencies {
  const hasRedis = Boolean(env.REDIS_URL);
  const hasOpenAI = Boolean(env.OPENAI_API_KEY);
  const hasTwilio = Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER);
  const hasExternalApi = Boolean(env.EXTERNAL_API_BASE_URL);

  const db = {
    async ping(): Promise<DependencyStatus> {
      return available("mock", "in-memory");
    },
    async close(): Promise<void> {},
  };

  const redis = {
    async ping(): Promise<DependencyStatus> {
      if (!hasRedis) {
        return unavailable("mock", "REDIS_URL missing");
      }
      return available("live");
    },
    async close(): Promise<void> {},
  };

  const openai = {
    async ping(): Promise<DependencyStatus> {
      if (!hasOpenAI) {
        return unavailable("mock", "OPENAI_API_KEY missing");
      }
      return available("live");
    },
  };

  const twilio = {
    async ping(): Promise<DependencyStatus> {
      if (!hasTwilio) {
        return unavailable("mock", "Twilio credentials missing");
      }
      return available("live");
    },
  };

  const externalApi = {
    async ping(): Promise<DependencyStatus> {
      if (!hasExternalApi) {
        return unavailable("mock", "EXTERNAL_API_BASE_URL missing");
      }
      return available("live");
    },
  };

  return {
    db,
    redis,
    openai,
    twilio,
    externalApi,
    async closeAll() {
      await Promise.all([db.close(), redis.close()]);
    },
  };
}
