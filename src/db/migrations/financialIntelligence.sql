CREATE TABLE IF NOT EXISTS maya_revenue_forecast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT,
  predicted_revenue NUMERIC,
  predicted_closes INT,
  confidence NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE maya_marketing_metrics
ADD COLUMN IF NOT EXISTS performance_weight NUMERIC DEFAULT 1.0;

CREATE TABLE IF NOT EXISTS broker_compensation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID,
  month TEXT,
  total_revenue NUMERIC,
  commission_rate NUMERIC,
  commission_due NUMERIC,
  bonus NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
