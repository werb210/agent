CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

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
