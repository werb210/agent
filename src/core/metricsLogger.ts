import { pool } from "../integrations/bfServerClient";

export async function recordMetric(name: string, value: number, metadata?: any) {
  await pool.request(
    `INSERT INTO maya_metrics (metric_name, metric_value, metadata)
     VALUES ($1,$2,$3)`,
    [name, value, metadata || {}]
  );
}
