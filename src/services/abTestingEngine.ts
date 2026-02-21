import { pool } from "../db";

export async function recordImpression(testId: number, variant: string) {
  await pool.query(
    "UPDATE maya_ab_results SET impressions = impressions + 1 WHERE test_id = $1 AND variant = $2",
    [testId, variant]
  );
}

export async function recordConversion(testId: number, variant: string) {
  await pool.query(
    "UPDATE maya_ab_results SET conversions = conversions + 1 WHERE test_id = $1 AND variant = $2",
    [testId, variant]
  );
}

export async function evaluateWinner(testId: number) {
  const res = await pool.query(
    "SELECT variant, conversions, impressions FROM maya_ab_results WHERE test_id = $1",
    [testId]
  );

  const results = res.rows.map(r => ({
    variant: r.variant,
    rate: r.impressions ? r.conversions / r.impressions : 0
  }));

  results.sort((a, b) => b.rate - a.rate);

  return results[0];
}
