import { pool } from "../db";

type ProbabilityPayload = {
  funding_amount: number;
  annual_revenue: number;
  time_in_business: number;
};

type FeatureWeightRow = {
  feature: string;
  weight: string | number | null;
};

const DEFAULT_FEATURE_BASELINES: Record<string, number> = {
  funding_amount: 100000,
  annual_revenue: 500000,
  time_in_business: 24
};

export async function calculateFundingProbability(payload: ProbabilityPayload) {
  const weights = await pool.query<FeatureWeightRow>(`
    SELECT feature, weight FROM maya_feature_weights
  `);

  const baselineMap = { ...DEFAULT_FEATURE_BASELINES };

  for (const row of weights.rows) {
    const parsedWeight = Number(row.weight);
    if (Number.isFinite(parsedWeight) && parsedWeight > 0) {
      baselineMap[row.feature] = parsedWeight;
    }
  }

  const normalizedScore =
    (payload.funding_amount / baselineMap.funding_amount) * 0.3 +
    (payload.annual_revenue / baselineMap.annual_revenue) * 0.4 +
    (payload.time_in_business / baselineMap.time_in_business) * 0.3;

  return Math.min(0.95, Math.max(0.05, normalizedScore));
}
