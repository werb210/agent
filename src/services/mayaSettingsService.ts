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
      require_confirmation: true,
      allow_ad_adjustment: false,
      max_auto_budget_adjust_percent: 10,
      high_value_threshold: 500000,
      auto_outbound_enabled: false,
      allow_full_auto_marketing: false,
      max_daily_budget_shift_percent: 20,
      min_data_points_before_adjustment: 30
    };
  }

  return result.rows[0];
}
