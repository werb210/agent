CREATE TABLE lender_users (
  id SERIAL PRIMARY KEY,
  lender_id INT REFERENCES lenders(id),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE lender_deals (
  id SERIAL PRIMARY KEY,
  lender_id INT REFERENCES lenders(id),
  session_id TEXT,
  status TEXT DEFAULT 'NEW',
  CONSTRAINT lender_deals_lender_session_unique UNIQUE (lender_id, session_id)
);

CREATE TABLE deal_events (
  id SERIAL PRIMARY KEY,
  session_id TEXT,
  event_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
