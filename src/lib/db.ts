export const pool = {
  query: async (..._args: any[]) => ({
    rows: [],
    rowCount: 0,
  }),
};

export async function queryDb(sql: string, params: any[]) {
  return pool.query(sql, params);
}
