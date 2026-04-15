export type QueryResult<T = any> = { rows: T[]; rowCount: number };

async function request<T = any>(_statement: string, _params: unknown[] = []): Promise<QueryResult<T>> {
  return { rows: [], rowCount: 0 };
}

export const pool = {
  request,
  query: request,
  async connect() {
    return Promise.resolve();
  },
};

export default {
  pool,
};
