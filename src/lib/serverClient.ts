export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }
  | { status: "ok"; data: T }
  | { status: "error"; error: string };

const BASE_URL = process.env.SERVER_URL || "";
const DB_NOT_READY_ERROR = "DB_NOT_READY";
const MAX_READY_RETRIES = 3;
const RETRY_DELAY_MS = 500;

function buildUrl(path: string): string {
  if (!path.startsWith("/api/")) {
    throw new Error(`Invalid path: ${path}`);
  }

  return `${BASE_URL}${path}`;
}

function normalize<T>(res: unknown): T {
  if (!res || typeof res !== "object") {
    throw new Error("INVALID_RESPONSE");
  }

  if ("status" in res && (res as { status?: unknown }).status === "error") {
    throw new Error(String((res as { error?: unknown }).error ?? "INVALID_RESPONSE"));
  }

  if ("success" in res && (res as { success?: unknown }).success === false) {
    throw new Error(String((res as { error?: unknown }).error ?? "INVALID_RESPONSE"));
  }

  if (!("data" in res)) {
    throw new Error("INVALID_RESPONSE");
  }

  return (res as { data: T }).data;
}

async function callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < MAX_READY_RETRIES; i += 1) {
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message !== DB_NOT_READY_ERROR) {
        throw error;
      }

      if (i < MAX_READY_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  throw new Error("SERVICE_UNAVAILABLE");
}

export async function serverPost<T>(
  path: string,
  body: unknown,
  authToken?: string
): Promise<T> {
  if (!authToken) {
    throw new Error("Missing auth token");
  }

  return callWithRetry(async () => {
    const res = await globalThis["fetch"](buildUrl(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(body)
    });

    const json = await res.json();
    return normalize<T>(json as ApiResponse<T>);
  });
}

export { callWithRetry, normalize };
