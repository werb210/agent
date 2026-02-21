import { pool } from "../db";

export async function retrainModel() {
  const data = await pool.query(`
    SELECT funding_amount, time_in_business,
           annual_revenue, funded
    FROM maya_training_data
  `);

  let fundingWeight = 0;
  let revenueWeight = 0;
  let tibWeight = 0;

  for (const row of data.rows) {
    if (row.funded) {
      fundingWeight += Number(row.funding_amount);
      revenueWeight += Number(row.annual_revenue);
      tibWeight += Number(row.time_in_business);
    }
  }

  fundingWeight = fundingWeight / (data.rowCount || 1);
  revenueWeight = revenueWeight / (data.rowCount || 1);
  tibWeight = tibWeight / (data.rowCount || 1);

  await pool.query(
    `
      INSERT INTO maya_feature_weights (feature, weight)
      VALUES
      ('funding_amount',$1),
      ('annual_revenue',$2),
      ('time_in_business',$3)
      ON CONFLICT (feature)
      DO UPDATE SET weight=EXCLUDED.weight, updated_at=NOW()
    `,
    [fundingWeight, revenueWeight, tibWeight]
  );
}
