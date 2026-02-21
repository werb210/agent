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

  if (stage === "booking") {
    const utmSource =
      typeof context.utm_source === "string"
        ? context.utm_source
        : typeof context.utmSource === "string"
          ? context.utmSource
          : null;
    const utmCampaign =
      typeof context.utm_campaign === "string"
        ? context.utm_campaign
        : typeof context.utmCampaign === "string"
          ? context.utmCampaign
          : null;
    const funded = typeof context.funded === "boolean" ? context.funded : false;

    await pool.query(
      `INSERT INTO marketing_sessions (session_id, utm_source, utm_campaign, booked, funded)
       VALUES ($1, $2, $3, true, $4)
       ON CONFLICT (session_id)
       DO UPDATE SET
         utm_source = EXCLUDED.utm_source,
         utm_campaign = EXCLUDED.utm_campaign,
         booked = true,
         funded = EXCLUDED.funded`,
      [sessionId, utmSource, utmCampaign, funded]
    );
  }
}
