import { areToolHandlersLoaded } from "./ai/toolExecutor";
import { pool } from "./integrations/bfServerClient";

export async function checkHealth(): Promise<{ status: "ok" }> {
  await pool.query("SELECT 1");

  if (!areToolHandlersLoaded()) {
    throw new Error("HANDLERS_NOT_READY");
  }

  return { status: "ok" };
}

export async function cleanupResources(): Promise<void> {
  return Promise.resolve();
}
