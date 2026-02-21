import { pool } from "../db";

type PortfolioRiskRow = {
  industry: string | null;
  avg_risk: string | number | null;
};

export async function generateRiskHeatmap() {
  const data = await pool.query<PortfolioRiskRow>(`
    SELECT industry,
           AVG(risk_score) AS avg_risk
    FROM sessions
    GROUP BY industry
  `);

  return data.rows.map((row) => {
    const avgRisk = Number(row.avg_risk ?? 0);

    return {
      industry: row.industry ?? "unknown",
      risk_level: avgRisk > 0.7 ? "high" : avgRisk > 0.4 ? "moderate" : "low"
    };
  });
}
