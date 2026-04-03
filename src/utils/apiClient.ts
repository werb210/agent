import { v4 as uuidv4 } from "uuid";

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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-request-id": uuidv4(),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  let payload: any = null;

  try {
    payload = await res.json();
  } catch {
    // ignore JSON parse errors
  }

  // 🔴 THROW ONLY ON HTTP FAILURE
  if (!res.ok) {
    throw new Error(`API ERROR ${res.status}`);
  }

  // 🔴 THROW ONLY IF API STATUS IS NOT OK
  if (payload && payload.status && payload.status !== "ok") {
    const message =
      payload?.error?.message ||
      payload?.message ||
      JSON.stringify(payload);

    throw new Error(`API ERROR: ${message}`);
  }

  // ✅ SUCCESS CASE
  if (payload && payload.status === "ok") {
    return payload.data;
  }

  // fallback
  return payload;
}
