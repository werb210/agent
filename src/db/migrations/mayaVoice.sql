CREATE TABLE IF NOT EXISTS maya_voice_sessions (
  id UUID PRIMARY KEY,
  call_sid TEXT,
  phone TEXT,
  transcript TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
