import { pool } from "../db";

export async function recalculateBrokerPerformance() {
  const brokers = await pool.query("SELECT * FROM staff_calendar");

  for (const broker of brokers.rows) {
    const calls = broker.total_calls || 1;
    const closes = broker.successful_closes || 0;
    const closeRate = closes / calls;

    const performanceScore = (closeRate * 2) + (broker.avg_response_speed || 1);

    await pool.query(
      `
        UPDATE staff_calendar
        SET performance_score = $1,
            avg_close_rate = $2,
            last_performance_update = NOW()
        WHERE id = $3
      `,
      [performanceScore, closeRate, broker.id]
    );
  }
}
