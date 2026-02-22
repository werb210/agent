CREATE TABLE IF NOT EXISTS maya_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  model_version TEXT,
  probability NUMERIC,
  feature_contributions JSONB,
  reasoning_summary TEXT,
  confidence_score NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_explanations_session
ON maya_explanations(session_id);
