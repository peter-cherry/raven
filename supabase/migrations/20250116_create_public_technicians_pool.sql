-- Create default "Public Technicians Pool" organization
-- This org serves as the home for self-registered technicians who don't belong to a company

-- Check if the organization already exists before inserting
INSERT INTO organizations (id, name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- Fixed UUID for consistency
  'Public Technicians Pool',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Add comment explaining the purpose
COMMENT ON TABLE organizations IS 'Organizations table - includes company accounts and the Public Technicians Pool for self-registered technicians';

-- Update any existing technicians with NULL org_id to belong to the public pool
UPDATE technicians
SET org_id = '00000000-0000-0000-0000-000000000001'
WHERE org_id IS NULL;

-- Add a check constraint to ensure all future technicians have an org_id
-- (We'll allow NULL for now in case there are edge cases, but the API will default to public pool)
-- ALTER TABLE technicians
-- ADD CONSTRAINT technicians_org_id_not_null CHECK (org_id IS NOT NULL);
