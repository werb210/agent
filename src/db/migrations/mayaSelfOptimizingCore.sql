CREATE TABLE IF NOT EXISTS maya_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_amount NUMERIC,
  product_type TEXT,
  time_in_business INT,
  annual_revenue NUMERIC,
  industry TEXT,
  funded BOOLEAN,
  lender_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maya_feature_weights (
  feature TEXT PRIMARY KEY,
  weight NUMERIC,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maya_commission_models (
  product_type TEXT PRIMARY KEY,
  optimal_rate NUMERIC,
  updated_at TIMESTAMP DEFAULT NOW()
);
