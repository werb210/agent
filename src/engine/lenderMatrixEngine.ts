import { pool } from "../config/pool";

export async function evaluateLenders(deal: any) {
  const result = await pool.query("SELECT * FROM lenders");

  const matches: string[] = [];

  for (const lender of result.rows) {
    if (deal.time_in_business_months < lender.min_time_months) continue;
    if (deal.monthly_revenue < lender.min_revenue) continue;
    if (deal.funding_amount < lender.min_funding) continue;
    if (deal.funding_amount > lender.max_funding) continue;
    if (!lender.allowed_industries.includes(deal.industry?.toLowerCase())) continue;

    matches.push(lender.name);
  }

  return matches;
}

export async function getLenderMatchesFromMatrix(amount: number, tier: string) {
  const result = await pool.query(
    `SELECT lender_name
     FROM lender_matrix
     WHERE tier = $1
       AND $2 BETWEEN min_amount AND max_amount
     ORDER BY lender_name ASC`,
    [tier, amount]
  );

  return result.rows.map((row) => row.lender_name as string);
}
