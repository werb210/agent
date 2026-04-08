import { RuntimeDependencies, type AdapterStatus } from "./types";

type AdapterMode = "required" | "optional";

type AdapterConfig = {
  mode: AdapterMode;
  configured: boolean;
};

function createAdapter(config: AdapterConfig) {
  let connected = false;

  const connect = async () => {
    if (!config.configured) {
      connected = false;
      return;
    }

    connected = true;
  };

  const status = async (): Promise<AdapterStatus> => {
    if (!config.configured) {
      return config.mode === "required" ? "down" : "degraded";
    }

    if (!connected) {
      await connect();
    }

    return connected ? "ok" : "down";
  };

  return {
    status,
    connect,
    close: async () => {
      connected = false;
    },
  };
}

async function safeClose(name: string, close?: () => Promise<void>) {
  if (!close) {
    return;
  }

  try {
    await close();
  } catch (error) {
    console.error(`Failed to close dependency: ${name}`, error);
  }
}

export function createDependencies(env: NodeJS.ProcessEnv = process.env): RuntimeDependencies {
  const db = createAdapter({
    mode: "required",
    configured: Boolean(env.DATABASE_URL),
  });
  const redis = createAdapter({
    mode: "required",
    configured: Boolean(env.REDIS_URL),
  });
  const openai = createAdapter({
    mode: "optional",
    configured: Boolean(env.OPENAI_API_KEY),
  });
  const twilio = createAdapter({
    mode: "optional",
    configured: Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER),
  });
  const externalApi = createAdapter({
    mode: "required",
    configured: Boolean(env.EXTERNAL_API_BASE_URL),
  });

  return {
    db,
    redis,
    openai,
    twilio,
    externalApi,
    async initAll() {
      await Promise.all([db.connect(), redis.connect(), openai.connect(), twilio.connect(), externalApi.connect()]);
    },
    async closeAll() {
      await Promise.all([
        safeClose("db", db.close),
        safeClose("redis", redis.close),
        safeClose("openai", openai.close),
        safeClose("twilio", twilio.close),
        safeClose("externalApi", externalApi.close),
      ]);
    },
  };
}
