-- Create default organization
INSERT INTO organizations (id, name, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Default Organization',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;
