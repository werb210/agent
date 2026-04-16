import { pool } from "../integrations/bfServerClient";

export type CallEvent = {
  callId: string;
  type: string;
  payload: unknown;
};

export async function saveEvent(event: CallEvent) {
  await pool.query(
    `
    INSERT INTO call_events (call_id, type, payload, created_at)
    VALUES ($1, $2, $3, NOW())
    `,
    [event.callId, event.type, JSON.stringify(event.payload)]
  );
}

export async function getCallEvents(callId: string) {
  const res = await pool.query(
    "SELECT * FROM call_events WHERE call_id = $1 ORDER BY created_at ASC",
    [callId]
  );

  return res.rows;
}
