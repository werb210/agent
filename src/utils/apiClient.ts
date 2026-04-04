const BASE =
  process.env.API_BASE_URL ||
  process.env.AGENT_API_BASE_URL ||
  'http://localhost:8080';

const TOKEN = process.env.AGENT_API_TOKEN;

type ApiOptions = RequestInit & { headers?: Record<string, string> };

export async function apiCall(path: string, options: ApiOptions = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Agent API error ${res.status}: ${text}`);
  }

  return res.json();
}

// Backward-compatible export used across the codebase.
export const apiFetch = apiCall;
