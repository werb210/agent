CREATE TABLE IF NOT EXISTS maya_intelligence (
  id SERIAL PRIMARY KEY,
  metric TEXT,
  value FLOAT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maya_decisions (
  id SERIAL PRIMARY KEY,
  session_id TEXT,
  decision_type TEXT,
  confidence FLOAT,
  outcome TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
