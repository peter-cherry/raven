-- ===================================================================
-- Fix RLS Circular Dependency Issue
-- ===================================================================
-- Problem: RLS policies on jobs/technicians/etc reference org_memberships
-- in their USING clause, but org_memberships itself has RLS enabled.
-- This creates a circular dependency where policies can't evaluate.
--
-- Solution: Create a SECURITY DEFINER function that bypasses RLS
-- to get user's org_ids, then use that in RLS policies.
-- ===================================================================

-- Create helper function to get user's organization IDs (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_org_ids()
RETURNS TABLE (org_id UUID)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT org_id
  FROM public.org_memberships
  WHERE user_id = auth.uid();
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.user_org_ids() TO authenticated;

-- ===================================================================
-- Update RLS Policies to Use Helper Function
-- ===================================================================

-- 1. TECHNICIANS TABLE
DROP POLICY IF EXISTS "Users can view technicians from their org" ON technicians;
DROP POLICY IF EXISTS "Users can create technicians in their org" ON technicians;
DROP POLICY IF EXISTS "Users can update technicians in their org" ON technicians;
DROP POLICY IF EXISTS "Users can delete technicians from their org" ON technicians;

CREATE POLICY "Users can view technicians from their org"
  ON technicians
  FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Users can create technicians in their org"
  ON technicians
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Users can update technicians in their org"
  ON technicians
  FOR UPDATE
  TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Users can delete technicians from their org"
  ON technicians
  FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT om.org_id
      FROM public.org_memberships om
      WHERE om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- 2. JOBS TABLE
DROP POLICY IF EXISTS "Users can view jobs from their org" ON jobs;
DROP POLICY IF EXISTS "Users can create jobs in their org" ON jobs;
DROP POLICY IF EXISTS "Users can update jobs in their org" ON jobs;
DROP POLICY IF EXISTS "Users can delete jobs from their org" ON jobs;

CREATE POLICY "Users can view jobs from their org"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Users can create jobs in their org"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Users can update jobs in their org"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Users can delete jobs from their org"
  ON jobs
  FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT om.org_id
      FROM public.org_memberships om
      WHERE om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- 3. RAW WORK ORDERS TABLE
DROP POLICY IF EXISTS "Users can view raw work orders from their org" ON raw_work_orders;
DROP POLICY IF EXISTS "Users can create raw work orders in their org" ON raw_work_orders;
DROP POLICY IF EXISTS "Users can update raw work orders in their org" ON raw_work_orders;
DROP POLICY IF EXISTS "Users can delete raw work orders from their org" ON raw_work_orders;

CREATE POLICY "Users can view raw work orders from their org"
  ON raw_work_orders
  FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Users can create raw work orders in their org"
  ON raw_work_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Users can update raw work orders in their org"
  ON raw_work_orders
  FOR UPDATE
  TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Users can delete raw work orders from their org"
  ON raw_work_orders
  FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT om.org_id
      FROM public.org_memberships om
      WHERE om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- ===================================================================
-- VERIFICATION
-- ===================================================================

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'RLS CIRCULAR DEPENDENCY FIX APPLIED';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Created helper function: public.user_org_ids()';
  RAISE NOTICE 'Updated policies on: technicians, jobs, raw_work_orders';
  RAISE NOTICE '==============================================';
END $$;
