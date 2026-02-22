import { pool } from "../db";

type HistoricalProbabilityRow = {
  predicted_probability: string | number;
  actual: number;
};

export async function calibrateProbability() {
  const historical = await pool.query<HistoricalProbabilityRow>(`
    SELECT predicted_probability,
           (status='funded')::int as actual
    FROM sessions
    WHERE predicted_probability IS NOT NULL
  `);

  let totalError = 0;

  historical.rows.forEach((row) => {
    totalError += Math.abs(Number(row.predicted_probability) - row.actual);
  });

  return totalError / (historical.rowCount || 1);
}
