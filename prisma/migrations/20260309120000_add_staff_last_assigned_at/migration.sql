ALTER TABLE staff_calendar
ADD COLUMN IF NOT EXISTS last_assigned_at TIMESTAMP;
