export async function apiFetch(
  url: string,
  options: RequestInit = {}
) {
  // normalize URL
  url = url.replace(/([^:]\/)\/+/g, "$1");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // enforce request id
  if (!headers["x-request-id"]) {
    headers["x-request-id"] = `rid-${Math.random().toString(36).slice(2, 10)}`;
  }

  // enforce auth token
  const token = process.env.JWT_TOKEN || process.env.AGENT_API_TOKEN;
  if (!headers["Authorization"] && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
