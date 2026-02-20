DROP TABLE IF EXISTS sessions;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  task TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_session_id
ON sessions (session_id);

CREATE TABLE lender_matrix (
  id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
  lender_name TEXT NOT NULL,
  tier TEXT NOT NULL,
  min_amount DOUBLE PRECISION NOT NULL,
  max_amount DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE call_bookings (
  id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
  session_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  requested_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
