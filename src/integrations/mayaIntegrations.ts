import { logger } from "../infrastructure/logger";

const INTEGRATION_TIMEOUT_MS = 3_000;

async function withTimeout(name: string, job: () => Promise<void>) {
  const timeoutPromise = new Promise<void>((_, reject) => {
    setTimeout(() => reject(new Error(`${name}_timeout`)), INTEGRATION_TIMEOUT_MS);
  });

  try {
    await Promise.race([job(), timeoutPromise]);
  } catch (error) {
    logger.warn("maya_integration_failure", {
      integration: name,
      err: error instanceof Error ? error.message : String(error),
    });
  }
}

async function syncO365(_message: string): Promise<void> {
  return;
}

async function syncSlack(_message: string): Promise<void> {
  return;
}

async function syncPipeline(_message: string): Promise<void> {
  return;
}

export function triggerMayaIntegrations(message: string) {
  setImmediate(() => {
    void withTimeout("o365", () => syncO365(message));
    void withTimeout("slack", () => syncSlack(message));
    void withTimeout("pipeline", () => syncPipeline(message));
  });
}
