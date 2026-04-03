import { apiCall } from "../lib/api";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {})
  };

  if (!headers["x-request-id"]) {
    headers["x-request-id"] =
      "rid-" + Math.random().toString(36).slice(2, 10);
  }

  try {
    const json = await apiCall(path, {
      ...options,
      headers
    });

    if (json && typeof json === "object" && "status" in (json as Record<string, unknown>)) {
      const envelope = json as Record<string, unknown>;
      if (envelope.status === "ok" && "data" in envelope) {
        return envelope.data;
      }
      if (envelope.status === "error") {
        throw new Error(String(envelope.error || "API ERROR"));
      }
    }

    return json;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    const payload = error as any;
    const message = payload?.error?.message || JSON.stringify(payload);
    throw new Error(`API ERROR: ${message}`);
  }
}
