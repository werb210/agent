ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS compliance_flag BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS maya_retention_policy (
  entity_type TEXT PRIMARY KEY,
  retention_days INT NOT NULL
);

INSERT INTO maya_retention_policy(entity_type, retention_days)
VALUES ('sessions', 365)
ON CONFLICT DO NOTHING;
