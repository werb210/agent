DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maya_session_state') THEN
    CREATE TYPE maya_session_state AS ENUM (
      'new',
      'qualifying',
      'qualified',
      'booked',
      'submitted',
      'funded',
      'declined',
      'archived'
    );
  END IF;
END$$;

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS state maya_session_state DEFAULT 'new';

UPDATE sessions
SET state = COALESCE(state, 'new'::maya_session_state)
WHERE state IS NULL;

ALTER TABLE sessions
ALTER COLUMN state SET NOT NULL;

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS qualification_data JSONB DEFAULT '{}'::jsonb;

UPDATE sessions
SET qualification_data = '{}'::jsonb
WHERE qualification_data IS NULL;

ALTER TABLE sessions
ALTER COLUMN qualification_data SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_state ON sessions(state);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_assigned_broker ON sessions(assigned_broker_id);
CREATE INDEX IF NOT EXISTS idx_sessions_lender ON sessions(lender_id);
CREATE INDEX IF NOT EXISTS idx_rewards_action_type ON maya_rewards(action_type);
CREATE INDEX IF NOT EXISTS idx_campaign_status ON maya_campaigns(status);
