CREATE TABLE IF NOT EXISTS maya_decision_log (
  id SERIAL PRIMARY KEY,
  decision_type TEXT,
  input_data JSONB,
  output_data JSONB,
  explanation TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
