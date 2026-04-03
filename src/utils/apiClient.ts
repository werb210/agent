const BASE_URL =
  process.env.AGENT_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "http://localhost:8080";

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string
) {
  const url = `${BASE_URL}${path}`;

  const runtimeToken = token || process.env.AGENT_API_TOKEN || process.env.JWT_TOKEN;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-request-id": "rid-123", // deterministic for tests
    ...(options.headers as Record<string, string>),
  };

  if (runtimeToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${runtimeToken}`;
  }

  const res: any = await fetch(url, {
    ...options,
    headers,
  });

  let payload: any = null;

  try {
    payload = await res.json?.();
  } catch {
    payload = null;
  }

  const status = res?.status ?? 200;
  const ok = typeof res?.ok === "boolean" ? res.ok : status >= 200 && status < 300;

  if (!ok) {
    const message = payload?.error?.message || payload?.message || `API ERROR ${status}`;
    throw new Error(message.includes("API ERROR") ? message : `API ERROR ${status}`);
  }

  if (payload && payload.status && payload.status !== "ok") {
    const message =
      (typeof payload?.error === "string" ? payload.error : payload?.error?.message) ||
      payload?.message ||
      JSON.stringify(payload);

    throw new Error(message);
  }

  if (payload?.status === "ok") {
    return payload.data;
  }

  return payload;
}
