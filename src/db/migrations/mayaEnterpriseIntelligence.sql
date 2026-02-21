CREATE TABLE IF NOT EXISTS maya_llm_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model TEXT,
  tokens_input INT,
  tokens_output INT,
  estimated_cost NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maya_action_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT,
  payload JSONB,
  approved BOOLEAN DEFAULT FALSE,
  approved_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maya_campaign_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE VIEW maya_revenue_kpi AS
SELECT
  SUM(funding_amount) AS total_requested,
  COUNT(*) AS total_sessions,
  AVG(funding_amount) AS avg_ticket,
  SUM(roi_score) AS roi_score_total
FROM sessions;

CREATE TABLE IF NOT EXISTS maya_action_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT,
  payload JSONB,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
