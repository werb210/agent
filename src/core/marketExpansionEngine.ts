import { pool } from "../db";

export async function identifyExpansionMarkets() {
  const data = await pool.query(`
    SELECT industry,
           COUNT(*) FILTER (WHERE funded=true) AS wins,
           COUNT(*) AS total
    FROM maya_training_data
    GROUP BY industry
  `);

  return data.rows
    .map((row) => ({
      industry: row.industry,
      success_rate: Number(row.wins) / (Number(row.total) || 1)
    }))
    .sort((a, b) => b.success_rate - a.success_rate);
}
