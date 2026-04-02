export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }
  | { status: "ok"; data: T }
  | { status: "error"; error: string };

const BASE_URL = process.env.SERVER_URL || "";
const DB_NOT_READY_ERROR = "DB_NOT_READY";
const MAX_READY_RETRIES = 3;
const RETRY_DELAY_MS = 500;
const CIRCUIT_RESET_MS = 3000;
const CIRCUIT_OPEN_ERROR = "CIRCUIT_OPEN";

let open = false;
let lastFail = 0;

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

  if ((res as { status?: unknown }).status === "error") {
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

function allow(): boolean {
  if (!open) {
    return true;
  }

  return Date.now() - lastFail > CIRCUIT_RESET_MS;
}

function fail(): void {
  open = true;
  lastFail = Date.now();
}

function success(): void {
  open = false;
}

function retryDelay(attempt: number): number {
  return RETRY_DELAY_MS * (attempt + 1);
}

function circuitWaitMs(): number {
  if (!open) {
    return 0;
  }

  return Math.max(0, CIRCUIT_RESET_MS - (Date.now() - lastFail));
}

async function call<T>(fn: () => Promise<T>): Promise<T> {
  if (!allow()) {
    throw new Error(CIRCUIT_OPEN_ERROR);
  }

  try {
    const result = await fn();
    success();
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === DB_NOT_READY_ERROR) {
      fail();
    }
    throw error;
  }
}

async function callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  let attempts = 0;

  while (attempts < MAX_READY_RETRIES) {
    try {
      return await call(fn);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message === CIRCUIT_OPEN_ERROR) {
        const waitMs = Math.max(circuitWaitMs(), retryDelay(attempts));
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      if (message !== DB_NOT_READY_ERROR) {
        throw error;
      }

      attempts += 1;
      if (attempts < MAX_READY_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay(attempts - 1)));
      }
    }
  }

  throw new Error("SERVICE_UNAVAILABLE");
}

async function safeCall<T>(fn: () => Promise<T>): Promise<T | { status: "error"; error: string }> {
  try {
    return await call(fn);
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function checkReady(authToken: string, requestId: string): Promise<void> {
  const res = await globalThis["fetch"](buildUrl("/api/v1/ready"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "x-request-id": requestId
    }
  });

  const json = await res.json();
  normalize(json);
}

function resolveRequestId(provided?: string): string {
  return provided && provided.trim().length > 0 ? provided : `rid_${Date.now()}`;
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

  const rid = resolveRequestId(requestId);

  return callWithRetry(async () => {
    console.log(
      JSON.stringify({
        level: "info",
        rid,
        action: "agent_call"
      })
    );

    await checkReady(authToken, rid);

    const res = await globalThis["fetch"](buildUrl(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        "x-request-id": rid
      },
      body: JSON.stringify(body)
    });

    const json = await res.json();
    return normalize<T>(json as ApiResponse<T>);
  });
}

function resetCircuitStateForTests(): void {
  open = false;
  lastFail = 0;
}

export { callWithRetry, normalize, resetCircuitStateForTests, safeCall };
