import { callBFServer } from "./integrations/bfServerClient";

type QueryResult<T = any> = { rows: T[]; rowCount: number };

async function request<T = any>(statement: string, params: unknown[] = []): Promise<QueryResult<T>> {
  const data = await callBFServer<{ rows?: T[] }>("/api/internal/sql-compat", {
    statement,
    params
  });

  const rows = Array.isArray(data?.rows) ? data.rows : [];
  return { rows, rowCount: rows.length };
}

export const pool = {
  request,
  query: request,
  async connect() {
    return Promise.resolve();
  }
};


export default {
  pool
};
