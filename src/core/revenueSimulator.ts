import { pool } from "../db";

export interface RevenueSimulationInput {
  funding_amount: number;
  risk_score: number;
}

export interface RevenueSimulationResult {
  projectedFunding: number;
  commission: number;
  riskAdjusted: number;
}

export async function simulateRevenue(input: RevenueSimulationInput): Promise<RevenueSimulationResult> {
  const commissionRate = 0.03;

  const projectedFunding = input.funding_amount;
  const commission = projectedFunding * commissionRate;
  const riskAdjusted = commission * (1 - input.risk_score);

  await pool.query(
    `INSERT INTO maya_revenue_simulations
     (projected_funding, projected_commission, risk_adjusted_projection)
     VALUES ($1,$2,$3)`,
    [projectedFunding, commission, riskAdjusted]
  );

  return {
    projectedFunding,
    commission,
    riskAdjusted
  };
}
