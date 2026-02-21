CREATE TABLE IF NOT EXISTS maya_strategy_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT,
  strategic_focus TEXT,
  recommended_actions JSONB,
  projected_growth NUMERIC,
  confidence NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maya_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT,
  budget NUMERIC,
  target_industry TEXT,
  target_region TEXT,
  status TEXT DEFAULT 'planned',
  expected_roi NUMERIC,
  launched_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
