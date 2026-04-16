import { pool } from "../integrations/bfServerClient";


export async function buildStaffContext(dealId: string) {
  const deal = await pool.request(
    `SELECT id, status, funding_amount, tier, funding_score 
     FROM deals 
     WHERE id = $1`,
    [dealId]
  );

  if (!deal.rows.length) {
    return null;
  }

  return {
    dealId: deal.rows[0].id,
    status: deal.rows[0].status,
    fundingAmount: deal.rows[0].funding_amount,
    tier: deal.rows[0].tier,
    score: deal.rows[0].funding_score
  };
}
