CREATE TABLE IF NOT EXISTS ai_decisions (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  message TEXT,
  reply TEXT,
  confidence NUMERIC,
  escalated BOOLEAN DEFAULT FALSE,
  violation_detected BOOLEAN DEFAULT FALSE,
  autonomy_level TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
