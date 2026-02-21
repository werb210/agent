ALTER TABLE maya_settings
ADD COLUMN IF NOT EXISTS max_auto_budget_adjust_percent INT DEFAULT 10,
ADD COLUMN IF NOT EXISTS high_value_threshold INT DEFAULT 500000,
ADD COLUMN IF NOT EXISTS auto_outbound_enabled BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS deal_features (
  id SERIAL PRIMARY KEY,
  revenue FLOAT,
  years_in_business FLOAT,
  requested_amount FLOAT,
  industry TEXT,
  funded BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS maya_intelligence_metric_unique
ON maya_intelligence (metric)
WHERE metric IS NOT NULL;
