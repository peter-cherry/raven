-- Seed sample technicians
INSERT INTO technicians (
  org_id, full_name, trade_needed,
  city, state, lat, lng, average_rating,
  is_available, created_at
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440000',
  'John Smith',
  'HVAC',
  'New York',
  'NY',
  40.7128,
  -74.0060,
  4.8,
  true,
  now()
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Maria Garcia',
  'Plumbing',
  'New York',
  'NY',
  40.7150,
  -74.0080,
  4.9,
  true,
  now()
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Tom Wilson',
  'Electrical',
  'New York',
  'NY',
  40.7100,
  -74.0050,
  4.7,
  true,
  now()
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Sarah Johnson',
  'HVAC',
  'New York',
  'NY',
  40.7160,
  -74.0070,
  4.9,
  true,
  now()
)
ON CONFLICT DO NOTHING;
