CREATE TABLE IF NOT EXISTS maya_settings (
    id SERIAL PRIMARY KEY,
    autonomy_level INT DEFAULT 1,
    allow_booking BOOLEAN DEFAULT true,
    allow_transfer BOOLEAN DEFAULT true,
    require_confirmation BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO maya_settings (
  autonomy_level,
  allow_booking,
  allow_transfer,
  require_confirmation
)
SELECT 1, true, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM maya_settings
);
