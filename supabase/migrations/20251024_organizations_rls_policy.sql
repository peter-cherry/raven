-- Enable RLS on organizations table (if not already enabled)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their own organizations" ON organizations;

-- Allow users to view organizations they are members of
CREATE POLICY "Users can view their own organizations"
ON organizations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = organizations.id
    AND org_memberships.user_id = auth.uid()
  )
);

-- Allow authenticated users to create organizations
CREATE POLICY "Users can create organizations"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update organizations where they are owners
CREATE POLICY "Users can update their own organizations"
ON organizations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = organizations.id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role = 'owner'
  )
);
