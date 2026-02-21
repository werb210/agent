ALTER TABLE staff_calendar
ADD COLUMN IF NOT EXISTS total_calls INT DEFAULT 0;

ALTER TABLE staff_calendar
ADD COLUMN IF NOT EXISTS successful_closes INT DEFAULT 0;

ALTER TABLE staff_calendar
ADD COLUMN IF NOT EXISTS last_performance_update TIMESTAMP;

CREATE TABLE IF NOT EXISTS maya_marketing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT,
  spend NUMERIC,
  leads INT,
  conversions INT,
  roi NUMERIC,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maya_booking_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  broker_id UUID,
  booked_at TIMESTAMP,
  show_up BOOLEAN DEFAULT false,
  closed BOOLEAN DEFAULT false,
  revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
