CREATE TABLE IF NOT EXISTS maya_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type TEXT,
  version TEXT,
  accuracy NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);
