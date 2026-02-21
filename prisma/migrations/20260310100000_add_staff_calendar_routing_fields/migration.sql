ALTER TABLE staff_calendar
ADD COLUMN IF NOT EXISTS last_assigned_at TIMESTAMP;

ALTER TABLE staff_calendar
ADD COLUMN IF NOT EXISTS is_on_call BOOLEAN DEFAULT false;

ALTER TABLE staff_calendar
ADD COLUMN IF NOT EXISTS priority_weight INT DEFAULT 1;
