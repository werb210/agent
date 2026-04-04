const BASE =
  process.env.API_BASE_URL ||
  process.env.AGENT_API_BASE_URL ||
  'http://localhost:8080';

type ApiOptions = RequestInit & { headers?: Record<string, string> };

export async function apiCall(path: string, options: ApiOptions = {}) {
  const runtimeToken = process.env.AGENT_API_TOKEN || process.env.JWT_TOKEN || '';

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${runtimeToken}`,
      ...(options.headers || {}),
    },
  });

  let text = 'Unknown error';
  let json: unknown;

  if (typeof res.json === 'function') {
    try {
      json = await res.json();
      text = typeof json === 'string' ? json : JSON.stringify(json);
    } catch {
      json = undefined;
    }
  }

  if (!json && typeof res.text === 'function') {
    text = await res.text();
  }

  const isOk =
    typeof res.ok === 'boolean'
      ? res.ok
      : typeof res.status === 'number'
        ? res.status >= 200 && res.status < 300
        : true;

  if (!isOk) {
    throw new Error(`API ERROR ${res.status}`);
  }

  if (json && typeof json === 'object' && 'status' in json && (json as { status?: unknown }).status === 'error') {
    const err = (json as { error?: unknown }).error;
    throw new Error(typeof err === 'string' && err ? err : text);
  }

  if (json && typeof json === 'object' && 'data' in json) {
    return (json as { data: unknown }).data;
  }

  return json;
}

// Backward-compatible export used across the codebase.
export const apiFetch = apiCall;
