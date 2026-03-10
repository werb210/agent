import { pool } from "../../db";

export async function exportTrainingDataset() {
  const res = await pool.request(
    "SELECT revenue, years_in_business, requested_amount, industry, funded FROM deal_features WHERE funded IS NOT NULL"
  );
  return res.rows;
}

export async function recordModelVersion(version: string, accuracy: number) {
  await pool.request(
    "INSERT INTO maya_model_versions (version, accuracy) VALUES ($1,$2)",
    [version, accuracy]
  );
}
