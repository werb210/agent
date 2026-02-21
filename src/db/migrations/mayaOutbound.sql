CREATE TABLE IF NOT EXISTS maya_campaigns (
  id UUID PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maya_outbound_queue (
  id SERIAL PRIMARY KEY,
  campaign_id UUID REFERENCES maya_campaigns(id),
  company_name TEXT,
  contact_name TEXT,
  role TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
