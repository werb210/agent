import { pool } from "../db";
import { logAudit } from "../infrastructure/mayaAudit";

export async function generateRevenueForecast() {
  const bookings = await pool.query(`
    SELECT COUNT(*) as total_bookings
    FROM maya_booking_analytics
    WHERE created_at > NOW() - INTERVAL '30 days'
  `);

  const closes = await pool.query(`
    SELECT COUNT(*) as total_closes
    FROM maya_booking_analytics
    WHERE closed = true
    AND created_at > NOW() - INTERVAL '30 days'
  `);

  const revenue = await pool.query(`
    SELECT SUM(revenue) as total_revenue
    FROM maya_booking_analytics
    WHERE closed = true
    AND created_at > NOW() - INTERVAL '30 days'
  `);

  const totalBookings = Number(bookings.rows[0].total_bookings || 1);
  const totalCloses = Number(closes.rows[0].total_closes || 0);
  const totalRevenue = Number(revenue.rows[0].total_revenue || 0);

  const closeRate = totalCloses / totalBookings;
  const avgDealSize = totalRevenue / (totalCloses || 1);

  const projectedBookings = totalBookings * 1.1;
  const predictedCloses = Math.round(projectedBookings * closeRate);
  const predictedRevenue = predictedCloses * avgDealSize;

  const confidence = Math.min(closeRate * 2, 0.95);

  await pool.query(
    `
      INSERT INTO maya_revenue_forecast (month, predicted_revenue, predicted_closes, confidence)
      VALUES ($1,$2,$3,$4)
    `,
    [new Date().toISOString().slice(0, 7), predictedRevenue, predictedCloses, confidence]
  );

  await logAudit("maya", "revenue_forecast_generated", {
    predictedRevenue,
    predictedCloses,
    confidence
  });
}
