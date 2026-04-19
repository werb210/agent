import { pool } from "../integrations/bfServerClient.js";

export async function ensureDurableConversationTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS call_events (
      id SERIAL PRIMARY KEY,
      call_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query("CREATE INDEX IF NOT EXISTS idx_call_events_call_id ON call_events(call_id)");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS call_state (
      call_id TEXT PRIMARY KEY,
      state JSONB NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}
