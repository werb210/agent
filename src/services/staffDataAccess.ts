import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function getPipelineSummary() {

  const result = await pool.query(`
    SELECT status, COUNT(*) as count
    FROM applications
    GROUP BY status
  `);

  return result.rows;
}

export async function getApplicationsByStatus(status: string) {

  const result = await pool.query(`
    SELECT id, applicant_name, product_type, created_at
    FROM applications
    WHERE status = $1
    ORDER BY created_at DESC
    LIMIT 20
  `, [status]);

  return result.rows;
}
