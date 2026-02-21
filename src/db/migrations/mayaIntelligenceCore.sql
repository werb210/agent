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
