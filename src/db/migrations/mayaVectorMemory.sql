CREATE TABLE IF NOT EXISTS maya_vector_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT,
  entity_id TEXT,
  embedding FLOAT8[],
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
