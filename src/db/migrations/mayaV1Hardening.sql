CREATE TABLE IF NOT EXISTS maya_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT,
  user_id TEXT,
  action_type TEXT NOT NULL,
  token_usage INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

