CREATE TABLE IF NOT EXISTS maya_live_scores (
  id SERIAL PRIMARY KEY,
  deal_id TEXT,
  probability FLOAT,
  cluster TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
