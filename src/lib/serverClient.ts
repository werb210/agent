import { apiFetch } from "./apiClient";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }
  | { status: "ok"; data: T }
  | { status: "error"; error: string };

export function normalize<T>(res: unknown): T {
  if (!res || typeof res !== "object") {
    throw new Error("INVALID_RESPONSE_FORMAT");
  }

  if ((res as { status?: unknown }).status === "error") {
    throw new Error(String((res as { error?: unknown }).error ?? "INVALID_RESPONSE_FORMAT"));
  }

  if ("success" in res && (res as { success?: unknown }).success === false) {
    throw new Error(String((res as { error?: unknown }).error ?? "INVALID_RESPONSE_FORMAT"));
  }

  if (!("data" in res)) {
    throw new Error("INVALID_RESPONSE_FORMAT");
  }

  return (res as { data: T }).data;
}

export async function callServer<T>(url: string, body: unknown, token: string, rid: string): Promise<T> {
  const json = await apiFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-request-id": rid,
    },
    body: JSON.stringify(body),
  });

  return normalize<T>(json);
}

export async function serverPost<T>(
  path: string,
  body: unknown,
  authToken?: string,
  requestId?: string
): Promise<T> {
  if (!authToken) {
    throw new Error("Missing auth token");
  }

  const rid = requestId && requestId.trim().length > 0 ? requestId : `rid_${Date.now()}`;
  return callServer<T>(path, body, authToken, rid);
}

export async function callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  return fn();
}

export async function safeCall<T>(fn: () => Promise<T>): Promise<T | { status: "error"; error: string }> {
  try {
    return await fn();
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function resetCircuitStateForTests(): void {
  // no-op: retry/circuit logic removed to avoid masking endpoint contract failures.
}
