import { pool } from "../db/index";

export async function detectRevenueAnomalies(): Promise<void> {
  const revenue = await pool.query<{ total: string }>(
    `SELECT DATE(created_at) AS day,
            SUM(revenue) AS total
     FROM maya_booking_analytics
     GROUP BY day
     ORDER BY day DESC
     LIMIT 30`
  );

  const values = revenue.rows.map((entry) => Number(entry.total));

  if (values.length < 10) {
    return;
  }

  const average = values.reduce((acc, value) => acc + value, 0) / values.length;
  const anomalies = values.filter((value) => value > average * 1.5 || value < average * 0.5);

  if (anomalies.length > 0) {
    if (process.env.NODE_ENV !== "production") {
      console.info("Revenue anomaly detected.");
    }
  }
}
