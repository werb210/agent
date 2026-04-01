import { logger } from "../infrastructure/logger";
import { setTimeout as sleep } from "node:timers/promises";

const INTEGRATION_TIMEOUT_MS = 3_000;

async function withTimeout(name: string, job: () => Promise<void>) {
  const timeoutPromise = sleep(INTEGRATION_TIMEOUT_MS).then(() => {
    throw new Error(`${name}_timeout`);
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

export async function triggerMayaIntegrations(message: string): Promise<void> {
  await withTimeout("o365", () => syncO365(message));
  await withTimeout("slack", () => syncSlack(message));
  await withTimeout("pipeline", () => syncPipeline(message));
}
