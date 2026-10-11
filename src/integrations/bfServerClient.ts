/**
 * BF-Server integration client.
 * All agent data access goes through this module via real BF-Server API endpoints.
 * No direct database access. No vitest imports. No SQL compatibility proxy.
 */

// MAYA_BFSERVER_JWT_v53 — JWT-based service token for BF-Server.
// AGENT_v784_SERVICE_TOKEN - one signer for every call (src/lib/serviceToken.ts).
import { signServiceToken, logBFServerAuthFailure, serviceTokenSecret } from "../lib/serviceToken.js";
import { currentStaffScope } from "../lib/staffScope.js";

// AGENT_v789_TIMEOUTS - a BF-Server call never holds a Maya request open for long.
const BF_SERVER_TIMEOUT_MS = 8_000;

function getBaseUrl(): string {
  const url = process.env.SERVER_URL || process.env.BASE_URL;
  if (!url) {
    throw new Error("SERVER_URL is not configured");
  }
  return url;
}

function getAgentToken(): string {
  const secret = serviceTokenSecret();
  // MAYA_STAFF_SERVICE_JWT_FIX_v1 — BF-Server's staff Maya endpoints
  // (src/routes/mayaStaff.ts -> verifyMayaService) require a SERVICE token
  // shaped { kind: "service", source: "agent" | "maya-service" }. A role/user
  // token is rejected with 401 service_jwt_required, which made EVERY staff
  // tool (pipeline.query, contact.find, application.summary, etc.) fail and
  // Maya answer "I need more context". Mint a service token for those paths.
  // MAYA_SERVICE_JWT_ALL_MAYA_v1 - EVERY BF-Server Maya endpoint that the agent
  // calls through callBFServer is either verifyMayaService-gated (needs a
  // { kind:"service" } JWT) or ignores the token entirely -- none of them want a
  // user/role token. The original check only matched "/api/maya/staff/", so
  // non-staff verifyMayaService endpoints (catalog-summary, knowledge-search,
  // maya-persona) got a role token and 401'd (e.g. "how many lenders" failed).
  // Mint the service token for any /api/maya/ path.
  // MAYA_BFSERVER_JWT_v53 — Honor a pre-minted explicit token first (test
  // harness, manual override). Otherwise sign a real JWT using JWT_SECRET so
  // BF-Server's auth middleware verifies and hydrates capabilities from role.
  // AGENT_BLOCK_v487_MINTED_TOKEN_FIRST - a pre-minted AGENT_API_TOKEN left in the
  // App Service settings had gone stale, so every non-/api/maya/ call (the
  // talk-to-a-human handoff, staff presence) was refused and escalate.to_human
  // returned ok:false. The same handoff with a freshly minted token returns 200.
  // Mint whenever JWT_SECRET is available; the explicit token is only a fallback.
  const explicit = process.env.AGENT_API_TOKEN;
  if (!secret) return explicit && explicit !== "test_token" ? explicit : "";
  return signServiceToken();
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
  let requestBody = hasExplicitOptions
    ? (options as { body?: unknown }).body
    : Object.keys(options).length > 0
      ? options
      : undefined;

  // AGENT_v789_STAFF_SCOPE - inside a staff tool, silo and role are the verified ones.
  const scope = currentStaffScope();
  if (scope && path.startsWith("/api/maya/") && requestMethod !== "GET") {
    const base = requestBody && typeof requestBody === "object" && !Array.isArray(requestBody) ? (requestBody as Record<string, unknown>) : {};
    requestBody = { ...base, silo: scope.silo, role: scope.role ?? undefined };
  }

  const res = await fetch(url, {
    method: requestMethod,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(requestBody !== undefined
      ? { body: JSON.stringify(requestBody) }
      : {}),
    signal: AbortSignal.timeout(BF_SERVER_TIMEOUT_MS),
  });

  if (!res.ok) {
    logBFServerAuthFailure(path, res.status);
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

// AGENT_APPLICATION_SUMMARY_ROUTE_v436
// GET /api/applications/:id is a STUB on BF-Server (applications.ts:101) - it
// authenticates and returns { status: "ok", data: { id } } and nothing else.
// my_status and docs.checklist mapped that empty shell, found no fields, and
// answered ok:false with a null error, which a client read as "we cannot find
// your application". Use the summary route, which returns real data.
export async function fetchApplicationStatus(applicationId: string) {
  return callBFServer<any>("/api/maya/staff/application-summary", {
    method: "POST",
    body: { application_id: applicationId },
  });
}

// ─── Pool shim for legacy test compatibility ────────────────────────────────
// This shim is ONLY used in test mode via vitest mocking.
// It must never make real calls in production.
const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

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
