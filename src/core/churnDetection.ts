import { pool } from "../db";

type StalledRow = {
  id: string;
};

export async function detectStalledDeals() {
  const stalled = await pool.query<StalledRow>(`
    SELECT id
    FROM sessions
    WHERE status NOT IN ('funded','declined')
    AND updated_at < NOW() - INTERVAL '7 days'
  `);

  return stalled.rows;
}
