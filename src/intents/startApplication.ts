import { api } from "../lib/api.js";
import { withTimeout } from "../lib/withTimeout.js";

export async function startApplication(_input: string, context: unknown) {
  const normalizedContext = (context ?? {}) as { name?: string; email?: string };

  const payload = {
    name: normalizedContext.name || "Unknown",
    email: normalizedContext.email || "",
  };

  await withTimeout(
    api("/v1/crm/lead", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  );

  return {
    message: "Application started. Check your email.",
  };
}
