import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Lookup application by phone or email
 */
export async function findApplication(identifier: string) {
  const result = await pool.query(
    `SELECT id, status, product_type, created_at
     FROM applications
     WHERE phone = $1 OR email = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [identifier]
  );

  return result.rows[0] || null;
}

/**
 * Get document status summary
 */
export async function getDocumentStatus(applicationId: string) {
  const result = await pool.query(
    `SELECT document_type, status
     FROM documents
     WHERE application_id = $1`,
    [applicationId]
  );

  return result.rows;
}

/**
 * Get lender rate ranges (no underwriting logic)
 */
export async function getLenderProductRanges(productType: string) {
  const result = await pool.query(
    `SELECT lender_name, min_rate, max_rate
     FROM lender_products
     WHERE product_type = $1
     AND is_active = true`,
    [productType]
  );

  return result.rows;
}
