import { pool } from "../integrations/bfServerClient";


export async function buildMarketingContext() {
  const result = await pool.request(`
    SELECT 
      SUM(spend) as total_spend,
      SUM(leads) as total_leads,
      SUM(funded_deals) as funded
    FROM marketing_metrics
  `);

  return {
    totalSpend: result.rows[0].total_spend || 0,
    totalLeads: result.rows[0].total_leads || 0,
    fundedDeals: result.rows[0].funded || 0
  };
}
