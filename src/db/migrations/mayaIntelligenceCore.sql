CREATE TABLE IF NOT EXISTS maya_revenue_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projected_funding NUMERIC,
  projected_commission NUMERIC,
  risk_adjusted_projection NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maya_broker_scores (
  broker_id UUID PRIMARY KEY,
  close_rate NUMERIC,
  avg_ticket NUMERIC,
  performance_score NUMERIC,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maya_feature_weights (
  feature TEXT PRIMARY KEY,
  weight NUMERIC NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO maya_feature_weights (feature, weight)
VALUES
  ('funding_amount', 100000),
  ('annual_revenue', 500000),
  ('time_in_business', 24)
ON CONFLICT (feature) DO NOTHING;

CREATE TABLE IF NOT EXISTS maya_deal_ltv (
  session_id UUID PRIMARY KEY,
  projected_ltv NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);
