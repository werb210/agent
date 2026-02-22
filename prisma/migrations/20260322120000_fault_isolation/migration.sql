CREATE TABLE IF NOT EXISTS maya_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT,
  payload JSONB,
  attempts INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maya_dead_letter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT,
  payload JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
