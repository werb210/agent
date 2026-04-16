import { Pool } from "pg";

let _pool: Pool | null = null;

export const pool: Pool & { request: Pool["query"] } = (() => {
  if (!_pool) {
    _pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        "postgres://test:test@localhost:5432/test",
    });
  }

  const poolWithRequest = _pool as Pool & { request: Pool["query"] };

  if (typeof poolWithRequest.request !== "function") {
    poolWithRequest.request = poolWithRequest.query.bind(poolWithRequest);
  }

  return poolWithRequest;
})();

if (!pool || typeof pool.query !== "function") {
  throw new Error("DB pool not initialized correctly");
}
