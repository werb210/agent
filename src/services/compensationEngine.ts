import { pool } from "../db";

export async function calculateBrokerCompensation() {
  const brokers = await pool.query(`SELECT * FROM staff_calendar`);

  for (const broker of brokers.rows) {
    const revenueData = await pool.query(
      `
        SELECT SUM(revenue) as total_revenue
        FROM maya_booking_analytics
        WHERE broker_id = $1
        AND closed = true
        AND created_at > NOW() - INTERVAL '30 days'
      `,
      [broker.id]
    );

    const totalRevenue = Number(revenueData.rows[0].total_revenue || 0);

    const baseRate = 0.1;
    const performanceBonus = broker.performance_score > 1.5 ? 0.02 : 0;

    const commissionRate = baseRate + performanceBonus;
    const commissionDue = totalRevenue * commissionRate;

    await pool.query(
      `
        INSERT INTO broker_compensation
        (broker_id, month, total_revenue, commission_rate, commission_due)
        VALUES ($1,$2,$3,$4,$5)
      `,
      [
        broker.id,
        new Date().toISOString().slice(0, 7),
        totalRevenue,
        commissionRate,
        commissionDue
      ]
    );
  }
}
