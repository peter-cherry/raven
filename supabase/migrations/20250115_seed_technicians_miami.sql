-- Seed technicians in Miami with the correct org_id
INSERT INTO technicians (
  org_id, full_name, trade_needed, 
  city, state, lat, lng, average_rating, 
  is_available, created_at
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Mike Davis',
  'HVAC',
  'Miami',
  'FL',
  25.7617,
  -80.1918,
  4.8,
  true,
  now()
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Carlos Rodriguez',
  'Plumbing',
  'Miami',
  'FL',
  25.7650,
  -80.1950,
  4.9,
  true,
  now()
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Lisa Martinez',
  'Electrical',
  'Miami',
  'FL',
  25.7600,
  -80.1900,
  4.7,
  true,
  now()
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'James Wilson',
  'HVAC',
  'Miami',
  'FL',
  25.7640,
  -80.1930,
  4.9,
  true,
  now()
);
