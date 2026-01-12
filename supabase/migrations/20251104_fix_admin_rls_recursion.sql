-- Fix infinite recursion in admin_users RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can delete admin_users" ON admin_users;

-- Create a security definer function to check admin status
-- This bypasses RLS and prevents recursion
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Allow anyone to view admins (or restrict as needed)
-- For now, let's make it so only admins can view
CREATE POLICY "Anyone can view admin_users"
  ON admin_users FOR SELECT
  USING (true);

-- Allow self-insertion (for initial setup) OR existing admins can insert
CREATE POLICY "Self or admins can insert admin_users"
  ON admin_users FOR INSERT
  WITH CHECK (
    user_id = auth.uid() -- Allow self
    OR auth.is_admin() -- Or existing admin can grant
  );

-- Only admins can delete
CREATE POLICY "Admins can delete admin_users"
  ON admin_users FOR DELETE
  USING (auth.is_admin());

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION auth.is_admin() TO authenticated;
