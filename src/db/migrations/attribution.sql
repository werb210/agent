CREATE TABLE IF NOT EXISTS maya_attribution (
  id SERIAL PRIMARY KEY,
  lead_id TEXT,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  revenue FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);
