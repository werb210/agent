const BASE =
  process.env.AGENT_API_BASE_URL ||
  "http://localhost:8080";

function buildUrl(path: string) {
  const cleanPath = path.replace(/^\/+/, "");
  const cleanBase = BASE.replace(/\/+$/, "");
  return `${cleanBase}/${cleanPath}`;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const url = buildUrl(path);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // HARD REQUIRE REQUEST ID
  if (!headers["x-request-id"]) {
    headers["x-request-id"] =
      "rid-" + Math.random().toString(36).slice(2, 10);
  }

  // HARD REQUIRE AUTH (THIS WAS WEAK BEFORE)
  const token =
    process.env.AGENT_API_TOKEN ||
    process.env.JWT_TOKEN ||
    process.env.API_TOKEN;

  if (!token) {
    throw new Error("AGENT AUTH TOKEN MISSING");
  }

  if (!headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const ok = typeof res.ok === "boolean"
    ? res.ok
    : (typeof res.status === "number"
      ? res.status >= 200 && res.status < 300
      : true);

  if (!ok) {
    const text = typeof res.text === "function" ? await res.text() : "";
    throw new Error(`API ERROR ${res.status}: ${text}`);
  }

  if (typeof res.json === "function") {
    const json = await res.json();

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
  }

  return res as unknown;
}
