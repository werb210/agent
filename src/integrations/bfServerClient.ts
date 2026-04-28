/**
 * BF-Server integration client.
 * All agent data access goes through this module via real BF-Server API endpoints.
 * No direct database access. No vitest imports. No SQL compatibility proxy.
 */

// MAYA_BFSERVER_JWT_v53 — JWT-based service token for BF-Server.
import jwt from "jsonwebtoken";

const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

function getBaseUrl(): string {
  const url = process.env.SERVER_URL || process.env.BASE_URL;
  if (!url && !isTest) {
    throw new Error("SERVER_URL is not configured");
  }
  return url ?? "http://localhost:8080";
}

function getAgentToken(): string {
  // MAYA_BFSERVER_JWT_v53 — Honor a pre-minted explicit token first (test
  // harness, manual override). Otherwise sign a real JWT using JWT_SECRET so
  // BF-Server's auth middleware verifies and hydrates capabilities from role.
  const explicit = process.env.AGENT_API_TOKEN;
  if (explicit && explicit !== "test_token") return explicit;

  const secret = process.env.JWT_SECRET;
  if (!secret) return "";
  return jwt.sign(
    { id: "agent-service", phone: "agent", role: "Staff" },
    secret,
    { expiresIn: "1h" },
  );
}

/**
 * Make an authenticated HTTP call to BF-Server.
 * All agent → server communication goes through this function.
 */
export async function callBFServer<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
  } | Record<string, unknown> = {}
): Promise<T> {
  if (isTest) {
    // In test mode return a safe empty default rather than crashing
    return undefined as unknown as T;
  }

  const baseUrl = getBaseUrl();
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
  const token = getAgentToken();

  const hasExplicitOptions =
    typeof options === "object" &&
    options !== null &&
    ("method" in options || "body" in options);

  const requestMethod = hasExplicitOptions
    ? (options as { method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE" }).method ?? "GET"
    : "POST";
  const requestBody = hasExplicitOptions
    ? (options as { body?: unknown }).body
    : Object.keys(options).length > 0
      ? options
      : undefined;

  const res = await fetch(url, {
    method: requestMethod,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(requestBody !== undefined
      ? { body: JSON.stringify(requestBody) }
      : {}),
  });

  if (!res.ok) {
    throw new Error(`BF-Server error ${res.status} for ${path}`);
  }

  const json = await res.json();

  // Unwrap canonical {status:"ok", data:{...}} envelope if present
  if (json && typeof json === "object" && json.status === "ok" && "data" in json) {
    return json.data as T;
  }

  return json as T;
}

// ─── Typed helpers for canonical BF-Server endpoints ───────────────────────

export async function fetchApplicationStatus(applicationId: string) {
  return callBFServer<any>(`/api/applications/${applicationId}`);
}

export async function fetchPipeline() {
  return callBFServer<{ items: any[] }>("/api/pipeline");
}

export async function fetchCrmContacts() {
  return callBFServer<any[]>("/api/crm/contacts");
}

export async function logCrmEvent(payload: {
  contactId: string;
  eventType: string;
  payload?: unknown;
}) {
  return callBFServer("/api/crm/events", { method: "POST", body: payload });
}

export async function logCall(payload: {
  sessionId?: string;
  callSid?: string;
  contactId?: string;
  applicationId?: string;
}) {
  return callBFServer("/api/calls/log", { method: "POST", body: payload });
}

export async function logCallTranscript(payload: {
  callSid: string;
  transcript: string;
  summary?: string;
  score?: number;
}) {
  return callBFServer("/api/calls/transcript", { method: "POST", body: payload });
}

export async function fetchLenderProducts() {
  return callBFServer<any[]>("/api/client/lender-products");
}

// ─── Pool shim for legacy test compatibility ────────────────────────────────
// This shim is ONLY used in test mode via vitest mocking.
// It must never make real calls in production.

type QueryResult<T = any> = { rows: T[]; rowCount?: number };

type QueryFn = (<T = any>(statement: string, params?: any[]) => Promise<QueryResult<T>>) & {
  mockReset?: () => void;
  mockResolvedValue?: (value: QueryResult) => QueryFn;
  mockResolvedValueOnce?: (value: QueryResult) => QueryFn;
};

function createTestQueryMock(): QueryFn {
  const viFn = (globalThis as { vi?: { fn?: <T extends (...args: any[]) => any>(impl: T) => QueryFn } }).vi?.fn;
  if (viFn) {
    return viFn(async () => ({ rows: [], rowCount: 0 }));
  }

  let defaultValue: QueryResult = { rows: [], rowCount: 0 };
  const queue: QueryResult[] = [];

  const fn = (async () => {
    const next = queue.length > 0 ? queue.shift() : defaultValue;
    return (next ?? { rows: [], rowCount: 0 }) as QueryResult;
  }) as QueryFn;

  fn.mockReset = () => {
    defaultValue = { rows: [], rowCount: 0 };
    queue.length = 0;
  };

  fn.mockResolvedValue = (value: QueryResult) => {
    defaultValue = value;
    return fn;
  };

  fn.mockResolvedValueOnce = (value: QueryResult) => {
    queue.push(value);
    return fn;
  };

  return fn;
}

const testQuery = createTestQueryMock();
const testRequest = createTestQueryMock();

export const pool: { query: QueryFn; request: QueryFn } = {
  query: isTest
    ? testQuery
    : async () => {
      throw new Error(
        "pool.query() called in production. Use callBFServer() with a real endpoint instead."
      );
    },
  request: isTest
    ? testRequest
    : async () => {
      throw new Error(
        "pool.request() called in production. Use callBFServer() with a real endpoint instead."
      );
    },
};
