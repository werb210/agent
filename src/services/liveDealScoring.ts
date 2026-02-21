import { pool } from "../db";

export async function recordLiveScore(dealId: string, probability: number, cluster: string) {
  await pool.query(
    "INSERT INTO maya_live_scores (deal_id, probability, cluster) VALUES ($1,$2,$3)",
    [dealId, probability, cluster]
  );
}

export async function getLiveScores() {
  const res = await pool.query(
    "SELECT deal_id, probability, cluster FROM maya_live_scores ORDER BY created_at DESC LIMIT 20"
  );
  return res.rows;
}
