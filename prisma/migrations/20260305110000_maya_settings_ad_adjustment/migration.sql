ALTER TABLE maya_settings
ADD COLUMN IF NOT EXISTS allow_ad_adjustment BOOLEAN DEFAULT false;
