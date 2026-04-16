import { vi } from "vitest";
import { callMaya } from "../api/maya";

export async function callBFServer<T>(path: string, payload?: any): Promise<T> {
  const baseUrl = process.env.SERVER_URL || process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error("SERVER_URL not configured");
  }

  const normalizedPath = /^https?:\/\//i.test(path) ? path : `${baseUrl}${path}`;
  const result = await callMaya(normalizedPath, payload);

  if (!result) {
    console.error("BF SERVER EMPTY RESPONSE:", path);
    throw new Error("Empty BF server response");
  }

  return result as T;
}

type QueryResult<T = any> = {
  rows: T[];
  rowCount?: number;
};

type QueryFn = (<T = any>(statement: string, params?: any[]) => Promise<QueryResult<T>>) & {
  mockReset?: () => unknown;
  mockResolvedValue?: (value: unknown) => unknown;
  mockResolvedValueOnce?: (value: unknown) => unknown;
};

const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

const queryMock = vi.fn(async () => ({ rows: [], rowCount: 0 })) as QueryFn;
const requestMock = vi.fn(async () => ({ rows: [], rowCount: 0 })) as QueryFn;

/**
 * Temporary compatibility shim for legacy callers during BF-server migration.
 * Prefer direct callBFServer() endpoint calls in new code.
 */
export const pool: { query: QueryFn; request: QueryFn } = isTest
  ? {
      query: queryMock,
      request: requestMock,
    }
  : {
      async query<T = any>(statement: string, params?: any[]): Promise<QueryResult<T>> {
        return callBFServer<QueryResult<T>>("/api/db/query", {
          method: "POST",
          body: { statement, params: params ?? [] },
        });
      },
      async request<T = any>(statement: string, params?: any[]): Promise<QueryResult<T>> {
        return callBFServer<QueryResult<T>>("/api/db/query", {
          method: "POST",
          body: { statement, params: params ?? [] },
        });
      },
    };
