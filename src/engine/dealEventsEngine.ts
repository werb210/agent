import { pool } from "../config/pool";
import { closingProbabilityFromVelocity } from "./predictiveEngine";

export async function trackDealEvent(sessionId: string, eventType: string) {
  await pool.query(
    "INSERT INTO deal_events (session_id, event_type) VALUES ($1, $2)",
    [sessionId, eventType]
  );
}

export async function getClosingProbability(sessionId: string) {
  const result = await pool.query(
    `SELECT event_type, created_at
     FROM deal_events
     WHERE session_id = $1
     ORDER BY created_at ASC`,
    [sessionId]
  );

  return closingProbabilityFromVelocity(result.rows);
}
