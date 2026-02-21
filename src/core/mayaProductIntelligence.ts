import { pool } from "../db";

export async function getAvailableProductCategories(): Promise<string[]> {
  const result = await pool.query(`
    SELECT DISTINCT category
    FROM lender_products
    WHERE active = true
  `);

  return result.rows.map((r: { category: string }) => r.category);
}

export async function getProductsByCategory(category: string): Promise<Array<{
  name: string;
  interest_rate_min: number;
  interest_rate_max: number;
  term_min: number;
  term_max: number;
}>> {
  const result = await pool.query(`
    SELECT name, interest_rate_min, interest_rate_max, term_min, term_max
    FROM lender_products
    WHERE category = $1
    AND active = true
  `, [category]);

  return result.rows;
}
