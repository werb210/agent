CREATE TABLE IF NOT EXISTS marketing_sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT UNIQUE,
  utm_source TEXT,
  utm_campaign TEXT,
  booked BOOLEAN DEFAULT false,
  funded BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
