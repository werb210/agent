import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function getMayaSettings() {

  const result = await pool.query(
    "SELECT * FROM maya_settings ORDER BY id DESC LIMIT 1"
  );

  if (!result.rows.length) {
    return {
      autonomy_level: 1,
      allow_booking: true,
      allow_transfer: true,
      require_confirmation: true
    };
  }

  return result.rows[0];
}
