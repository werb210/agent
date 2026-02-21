ALTER TABLE maya_settings
ADD COLUMN IF NOT EXISTS allow_full_auto_marketing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_daily_budget_shift_percent INT DEFAULT 20,
ADD COLUMN IF NOT EXISTS min_data_points_before_adjustment INT DEFAULT 30;

CREATE TABLE IF NOT EXISTS maya_marketing_actions (
  id SERIAL PRIMARY KEY,
  source TEXT,
  previous_budget FLOAT,
  new_budget FLOAT,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
