CREATE TABLE lenders (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  min_time_months INT,
  min_revenue INT,
  min_funding INT,
  max_funding INT,
  allowed_industries TEXT[],
  max_risk TEXT
);

INSERT INTO lenders
(name, min_time_months, min_revenue, min_funding, max_funding, allowed_industries, max_risk)
VALUES
('Prime Capital', 24, 50000, 50000, 1000000, ARRAY['construction','transport','manufacturing'], 'LOW'),
('Growth Finance', 12, 25000, 25000, 500000, ARRAY['construction','retail','services'], 'MEDIUM'),
('AltCap Funding', 6, 15000, 10000, 250000, ARRAY['construction','retail','services','transport'], 'HIGH');
