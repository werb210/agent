import { pool } from "../integrations/bfServerClient.js";

export async function adjustMarketingAllocation() {
  const channels = await pool.request(`SELECT * FROM maya_marketing_metrics`);

  for (const channel of channels.rows) {
    const roi = channel.roi || 0;
    const performanceWeight = channel.performance_weight || 1;

    const learningFactor = roi > 2 ? 1.15 : roi < 1 ? 0.85 : 1;

    const newWeight = performanceWeight * learningFactor;

    await pool.request(
      `
        UPDATE maya_marketing_metrics
        SET performance_weight = $1,
            spend = spend * $2,
            updated_at = NOW()
        WHERE id = $3
      `,
      [newWeight, learningFactor, channel.id]
    );
  }
}
