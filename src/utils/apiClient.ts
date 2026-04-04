const BASE_URL = process.env.API_BASE_URL;

type ApiOptions = RequestInit & { headers?: Record<string, string> };

export async function apiRequest(path: string, options: ApiOptions = {}) {
  if (!BASE_URL) {
    throw new Error('Missing API_BASE_URL');
  }

  const token = process.env.AGENT_API_TOKEN;
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export const apiCall = apiRequest;
// Backward-compatible export used across the codebase.
export const apiFetch = apiRequest;

export async function testConnection() {
  if (!BASE_URL) {
    throw new Error('Missing API_BASE_URL');
  }

  const res = await fetch(`${BASE_URL}/health`);
  const body = await res.text();
  console.log('API health:', body);
  return body;
}
