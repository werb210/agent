import { pool } from "../db";

export async function adjustMarketingAllocation() {
  const metrics = await pool.query(`
    SELECT * FROM maya_marketing_metrics
  `);

  for (const channel of metrics.rows) {
    const roi = channel.roi || 0;

    let adjustment = 1;

    if (roi > 2) {
      adjustment = 1.2;
    } else if (roi < 1) {
      adjustment = 0.8;
    }

    await pool.query(
      `
        UPDATE maya_marketing_metrics
        SET spend = spend * $1,
            updated_at = NOW()
        WHERE id = $2
      `,
      [adjustment, channel.id]
    );
  }
}
