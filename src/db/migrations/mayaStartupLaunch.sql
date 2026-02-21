ALTER TABLE crm_contacts
ADD COLUMN IF NOT EXISTS startup_notified BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS maya_startup_launch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launched_at TIMESTAMP DEFAULT NOW(),
  product_id UUID,
  total_notified INT
);
