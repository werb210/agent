CREATE TABLE IF NOT EXISTS maya_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT,
  reward_score NUMERIC,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maya_lender_yield (
  lender_id UUID PRIMARY KEY,
  avg_funding NUMERIC,
  avg_turnaround_days NUMERIC,
  success_rate NUMERIC,
  yield_score NUMERIC,
  updated_at TIMESTAMP DEFAULT NOW()
);
