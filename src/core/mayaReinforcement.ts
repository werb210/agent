import { pool } from "../db";

export async function updatePerformanceScore(campaignId: string): Promise<void> {
  const performance = await pool.query<{ roi: number | null; expected_roi: number | null }>(
    `SELECT roi, expected_roi
     FROM maya_campaigns
     WHERE id = $1`,
    [campaignId]
  );

  if (!performance.rows.length) {
    return;
  }

  const { roi, expected_roi } = performance.rows[0];
  const score = Number(roi ?? 0) / Number(expected_roi || 1);

  await pool.query(
    `UPDATE maya_campaigns
     SET performance_score = $1
     WHERE id = $2`,
    [score, campaignId]
  );
}
