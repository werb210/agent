import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function getLenderMatchesFromMatrix(amount: number, tier: string) {
  const result = await pool.query(
    `SELECT lender_name
     FROM lender_matrix
     WHERE tier = $1
       AND $2 BETWEEN min_amount AND max_amount
     ORDER BY lender_name ASC`,
    [tier, amount]
  );

  return result.rows.map((row) => row.lender_name as string);
}
