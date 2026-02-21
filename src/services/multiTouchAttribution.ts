import { pool } from "../db";

export async function multiTouchAttribution(leadId: string) {
  const res = await pool.query(
    "SELECT source, revenue FROM maya_attribution WHERE lead_id = $1",
    [leadId]
  );

  const totalRevenue = res.rows.reduce((sum, r) => sum + Number(r.revenue), 0);
  return res.rows.map(r => ({
    source: r.source,
    weightedRevenue: totalRevenue ? Number(r.revenue) / totalRevenue : 0
  }));
}
