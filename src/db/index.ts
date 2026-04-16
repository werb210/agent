import { createRequire } from "node:module";
import { vi } from "vitest";

const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

export type QueryResult = {
  rows: any[];
  rowCount?: number;
};

export type MockFn = any;

let _pool: any;

if (isTest) {
  const queryMock = vi.fn<[], Promise<QueryResult>>();
  const requestMock = vi.fn();

  _pool = {
    query: queryMock,
    request: requestMock,
  };
} else {
  const require = createRequire(import.meta.url);
  const { Pool } = require("pg") as { Pool: new (...args: any[]) => any };
  const realPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  _pool = {
    query: realPool.query.bind(realPool),
    request: (...args: any[]) => realPool.query(...args),
  };
}

export const pool = _pool;
