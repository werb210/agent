CREATE TABLE IF NOT EXISTS maya_ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT,
  account_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maya_generated_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID,
  headline TEXT,
  body TEXT,
  cta TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE maya_campaigns
ADD COLUMN IF NOT EXISTS platform_campaign_id TEXT;

ALTER TABLE maya_campaigns
ADD COLUMN IF NOT EXISTS performance_score NUMERIC DEFAULT 1.0;
