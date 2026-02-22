CREATE TABLE IF NOT EXISTS maya_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_name ON maya_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_created_at ON maya_metrics(created_at);
