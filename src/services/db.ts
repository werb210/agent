import { pool } from "../db";

export const db = {
  async getApplicationById(applicationId: string, userId: string) {
    const result = await pool.query(
      `SELECT id, user_id, status, requested_amount, product_type, created_at, updated_at
       FROM applications
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [applicationId, userId]
    );

    return result.rows[0] ?? null;
  }
};

