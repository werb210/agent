import { pool } from "../db";

export async function recordMetric(name: string, value: number, metadata?: any) {
  await pool.query(
    `INSERT INTO maya_metrics (metric_name, metric_value, metadata)
     VALUES ($1,$2,$3)`,
    [name, value, metadata || {}]
  );
}
