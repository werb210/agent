import { pool } from "../integrations/bfServerClient.js";

export async function recordLiveScore(dealId: string, probability: number, cluster: string) {
  await pool.request(
    "INSERT INTO maya_live_scores (deal_id, probability, cluster) VALUES ($1,$2,$3)",
    [dealId, probability, cluster]
  );
}

export async function getLiveScores() {
  const res = await pool.request(
    "SELECT deal_id, probability, cluster FROM maya_live_scores ORDER BY created_at DESC LIMIT 20"
  );
  return res.rows;
}
