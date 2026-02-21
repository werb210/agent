import { pool } from "../db";
import { SessionStage } from "../types/stages";

type SessionState = {
  stage: SessionStage;
  context: Record<string, unknown>;
};

export async function getSessionState(sessionId: string): Promise<SessionState> {
  const result = await pool.query(
    `SELECT stage, context
     FROM sessions
     WHERE id::text = $1 OR session_id = $1
     LIMIT 1`,
    [sessionId]
  );

  if (!result.rows.length) {
    return { stage: "new", context: {} };
  }

  return {
    stage: (result.rows[0].stage ?? "new") as SessionStage,
    context: (result.rows[0].context ?? {}) as Record<string, unknown>
  };
}

export async function updateSessionState(
  sessionId: string,
  stage: SessionStage,
  context: Record<string, unknown>
): Promise<void> {
  await pool.query(
    `UPDATE sessions
     SET stage = $2,
         context = $3,
         updated_at = NOW()
     WHERE id::text = $1 OR session_id = $1`,
    [sessionId, stage, JSON.stringify(context)]
  );
}
