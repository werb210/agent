CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS maya_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id UUID NOT NULL,
  agent_name TEXT,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  previous_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maya_audit_correlation
ON maya_audit_log(correlation_id);

CREATE INDEX IF NOT EXISTS idx_maya_audit_action
ON maya_audit_log(action_type);
