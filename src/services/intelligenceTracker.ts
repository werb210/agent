import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function updateMetric(metric: string, value: number) {
  await pool.query(
    `
    INSERT INTO maya_intelligence (metric, value)
    VALUES ($1, $2)
    `,
    [metric, value]
  );
}
