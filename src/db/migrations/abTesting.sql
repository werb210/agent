CREATE TABLE IF NOT EXISTS maya_ab_tests (
  id SERIAL PRIMARY KEY,
  test_name TEXT,
  variant_a TEXT,
  variant_b TEXT,
  metric TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maya_ab_results (
  id SERIAL PRIMARY KEY,
  test_id INT REFERENCES maya_ab_tests(id),
  variant TEXT,
  conversions INT DEFAULT 0,
  impressions INT DEFAULT 0
);
