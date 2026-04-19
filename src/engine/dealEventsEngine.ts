import { pool } from "../config/pool.js";
import { closingProbabilityFromVelocity } from "./predictiveEngine.js";

export async function trackDealEvent(sessionId: string, eventType: string) {
  await pool.request(
    "INSERT INTO deal_events (session_id, event_type) VALUES ($1, $2)",
    [sessionId, eventType]
  );
}

export async function getClosingProbability(sessionId: string) {
  const result = await pool.request(
    `SELECT event_type, created_at
     FROM deal_events
     WHERE session_id = $1
     ORDER BY created_at ASC`,
    [sessionId]
  );

  return closingProbabilityFromVelocity(result.rows);
}
