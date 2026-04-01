const API_BASE = process.env.SERVER_URL;

if (!API_BASE) {
  throw new Error("Missing SERVER_URL");
}

export async function apiRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (res.status === 401) {
    throw new Error("auth_expired");
  }

  if (!res.ok) {
    const text = await res.text();
    console.error("API_ERROR", { path, status: res.status, body: text });
    throw new Error(`API request failed: ${res.status}`);
  }

  return res.json();
}
