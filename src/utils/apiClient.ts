type ApiOptions = RequestInit & { headers?: Record<string, string> };

type ApiEnvelope = {
  status?: unknown;
  data?: unknown;
  error?: unknown;
};

function resolveBaseUrl(): string {
  return process.env.API_BASE_URL || process.env.API_URL || "";
}

function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = resolveBaseUrl();
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl}${path}`;
}

function isSuccessStatus(status: number | undefined): boolean {
  if (typeof status !== "number") {
    return true;
  }

  return status >= 200 && status < 300;
}

export async function apiRequest(path: string, options: ApiOptions = {}) {
  const token = process.env.AGENT_API_TOKEN || process.env.JWT_TOKEN;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(resolveUrl(path), {
    ...options,
    headers
  });

  const status = typeof res.status === "number" ? res.status : undefined;
  const ok = typeof res.ok === "boolean" ? res.ok : isSuccessStatus(status);

  if (!ok) {
    throw new Error(`API ERROR ${status ?? "UNKNOWN"}`);
  }

  const payload = (await res.json?.().catch(() => null)) as ApiEnvelope | null;

  if (payload && typeof payload === "object") {
    if (payload.status === "error") {
      throw new Error(String(payload.error || "API ERROR"));
    }

    if (payload.status === "ok" && "data" in payload) {
      return payload.data;
    }
  }

  return payload;
}

export const apiCall = apiRequest;
export const apiFetch = apiRequest;

export async function testConnection() {
  const baseUrl = resolveBaseUrl();
  if (!baseUrl) {
    throw new Error("Missing API_BASE_URL");
  }

  const res = await fetch(`${baseUrl}/health`);
  const body = await res.text();
  console.log("API health:", body);
  return body;
}
