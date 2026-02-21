CREATE TABLE IF NOT EXISTS maya_model_versions (
  id SERIAL PRIMARY KEY,
  version TEXT,
  accuracy FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);
