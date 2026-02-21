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

export async function increaseWeightForCluster(cluster: string, increment = 0.05) {
  const metric = `cluster_weight:${cluster}`;

  await pool.query(
    `
    INSERT INTO maya_intelligence (metric, value)
    VALUES ($1, $2)
    ON CONFLICT (metric)
    DO UPDATE SET
      value = COALESCE(maya_intelligence.value, 0) + $2,
      updated_at = NOW()
    `,
    [metric, increment]
  );
}

export async function learnFromDealOutcome(deal: { funded: boolean }, cluster: string) {
  if (deal.funded) {
    await increaseWeightForCluster(cluster);
  }
}
