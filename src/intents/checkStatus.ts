import { api } from "../lib/api.js";
import { withTimeout } from "../lib/withTimeout.js";

export async function checkStatus(_input: string, context: unknown) {
  const normalizedContext = (context ?? {}) as { email?: string };
  const email = normalizedContext.email || "";

  const res = await withTimeout(
    api("/v1/application/status", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  );

  const status =
    typeof res === "object" && res !== null && "status" in res
      ? String((res as { status?: unknown }).status ?? "Unknown")
      : "Unknown";

  return {
    message: `Status: ${status}`,
  };
}
