import { pool } from "../db";

export interface PredictivePayload {
  funding_amount: number;
  annual_revenue: number;
  time_in_business: number;
}

export async function predictiveLenderScore(payload: PredictivePayload) {
  const weights = await pool.query(`
    SELECT feature, weight FROM maya_feature_weights
  `);

  const weightMap: Record<string, number> = {};
  weights.rows.forEach((weight) => {
    weightMap[weight.feature] = Number(weight.weight);
  });

  const score =
    payload.funding_amount / (weightMap.funding_amount || 1) +
    payload.annual_revenue / (weightMap.annual_revenue || 1) +
    payload.time_in_business / (weightMap.time_in_business || 1);

  return score;
}
