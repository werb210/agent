import { pool } from "../config/pool";

export async function getSession(sessionId: string) {
  const result = await pool.query(
    "SELECT data FROM sessions WHERE session_id = $1",
    [sessionId]
  );

  if (result.rows.length === 0) {
    const empty = {
      structured: {},
      scoring: null,
      tier: null,
      product: null,
      lenderMatches: null,
      hotLead: false,
      approvalProbability: null,
      documentChecklist: [],
      probability: null,
      memo: null,
      checklist: [],
      conversation: []
    };

    await pool.query(
      "INSERT INTO sessions (session_id, data) VALUES ($1, $2)",
      [sessionId, empty]
    );

    return empty;
  }

  return result.rows[0].data;
}

export async function updateSession(sessionId: string, data: any) {
  await pool.query(
    "UPDATE sessions SET data = $1 WHERE session_id = $2",
    [data, sessionId]
  );
}
