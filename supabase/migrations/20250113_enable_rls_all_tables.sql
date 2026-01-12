-- =====================================================
-- CRITICAL: Enable Row Level Security on All Tables
-- =====================================================
-- This migration re-enables RLS that was disabled for testing
-- and ensures proper multi-tenant data isolation at the database level.

-- =====================================================
-- 1. TECHNICIANS TABLE
-- =====================================================

-- Enable RLS on technicians table
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view technicians from their org" ON technicians;
DROP POLICY IF EXISTS "Users can create technicians in their org" ON technicians;
DROP POLICY IF EXISTS "Users can update technicians in their org" ON technicians;
DROP POLICY IF EXISTS "Users can delete technicians from their org" ON technicians;

-- Allow users to view technicians from their organization
CREATE POLICY "Users can view technicians from their org"
  ON technicians
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to create technicians in their organization
CREATE POLICY "Users can create technicians in their org"
  ON technicians
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to update technicians in their organization
CREATE POLICY "Users can update technicians in their org"
  ON technicians
  FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete technicians from their organization (org owners only)
CREATE POLICY "Users can delete technicians from their org"
  ON technicians
  FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- =====================================================
-- 2. JOBS TABLE
-- =====================================================

-- Enable RLS on jobs table
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view jobs from their org" ON jobs;
DROP POLICY IF EXISTS "Users can create jobs in their org" ON jobs;
DROP POLICY IF EXISTS "Users can update jobs in their org" ON jobs;
DROP POLICY IF EXISTS "Users can delete jobs from their org" ON jobs;

-- Allow users to view jobs from their organization
CREATE POLICY "Users can view jobs from their org"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to create jobs in their organization
CREATE POLICY "Users can create jobs in their org"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to update jobs in their organization
CREATE POLICY "Users can update jobs in their org"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete jobs from their organization (org owners only)
CREATE POLICY "Users can delete jobs from their org"
  ON jobs
  FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- =====================================================
-- 3. RAW WORK ORDERS TABLE
-- =====================================================

-- Enable RLS on raw_work_orders table
ALTER TABLE raw_work_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view raw work orders from their org" ON raw_work_orders;
DROP POLICY IF EXISTS "Users can create raw work orders in their org" ON raw_work_orders;
DROP POLICY IF EXISTS "Users can update raw work orders in their org" ON raw_work_orders;
DROP POLICY IF EXISTS "Users can delete raw work orders from their org" ON raw_work_orders;

-- Allow users to view raw work orders from their organization
CREATE POLICY "Users can view raw work orders from their org"
  ON raw_work_orders
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to create raw work orders in their organization
CREATE POLICY "Users can create raw work orders in their org"
  ON raw_work_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to update raw work orders in their organization
CREATE POLICY "Users can update raw work orders in their org"
  ON raw_work_orders
  FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete raw work orders from their organization (org owners only)
CREATE POLICY "Users can delete raw work orders from their org"
  ON raw_work_orders
  FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- =====================================================
-- 4. ORG MEMBERSHIPS TABLE
-- =====================================================

-- Enable RLS on org_memberships table
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own org memberships" ON org_memberships;
DROP POLICY IF EXISTS "Users can view org memberships in their orgs" ON org_memberships;
DROP POLICY IF EXISTS "Org owners can create memberships" ON org_memberships;
DROP POLICY IF EXISTS "Org owners can update memberships" ON org_memberships;
DROP POLICY IF EXISTS "Org owners can delete memberships" ON org_memberships;

-- Allow users to view their own org memberships
CREATE POLICY "Users can view their own org memberships"
  ON org_memberships
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to view all memberships in organizations they belong to
CREATE POLICY "Users can view org memberships in their orgs"
  ON org_memberships
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Allow org owners to create memberships (invite users)
CREATE POLICY "Org owners can create memberships"
  ON org_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Allow org owners to update memberships (change roles)
CREATE POLICY "Org owners can update memberships"
  ON org_memberships
  FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Allow org owners to delete memberships (remove users)
CREATE POLICY "Org owners can delete memberships"
  ON org_memberships
  FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- =====================================================
-- 5. JOB DISPATCHES TABLE (if exists)
-- =====================================================

-- Enable RLS on job_dispatches table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_dispatches') THEN
    EXECUTE 'ALTER TABLE job_dispatches ENABLE ROW LEVEL SECURITY';

    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view dispatches from their org" ON job_dispatches;
    DROP POLICY IF EXISTS "Users can create dispatches in their org" ON job_dispatches;
    DROP POLICY IF EXISTS "Users can update dispatches in their org" ON job_dispatches;

    -- View policy
    EXECUTE 'CREATE POLICY "Users can view dispatches from their org"
      ON job_dispatches
      FOR SELECT
      TO authenticated
      USING (
        job_id IN (
          SELECT id FROM jobs
          WHERE org_id IN (
            SELECT org_id FROM public.org_memberships
            WHERE user_id = auth.uid()
          )
        )
      )';

    -- Create policy
    EXECUTE 'CREATE POLICY "Users can create dispatches in their org"
      ON job_dispatches
      FOR INSERT
      TO authenticated
      WITH CHECK (
        job_id IN (
          SELECT id FROM jobs
          WHERE org_id IN (
            SELECT org_id FROM public.org_memberships
            WHERE user_id = auth.uid()
          )
        )
      )';

    -- Update policy
    EXECUTE 'CREATE POLICY "Users can update dispatches in their org"
      ON job_dispatches
      FOR UPDATE
      TO authenticated
      USING (
        job_id IN (
          SELECT id FROM jobs
          WHERE org_id IN (
            SELECT org_id FROM public.org_memberships
            WHERE user_id = auth.uid()
          )
        )
      )';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Output a summary of RLS status for all tables
DO $$
DECLARE
  table_rec RECORD;
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'RLS STATUS SUMMARY';
  RAISE NOTICE '==============================================';

  FOR table_rec IN
    SELECT schemaname, tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('technicians', 'jobs', 'raw_work_orders', 'org_memberships', 'organizations', 'job_dispatches')
    ORDER BY tablename
  LOOP
    RAISE NOTICE '% - RLS: %',
      RPAD(table_rec.tablename, 25),
      CASE WHEN table_rec.rowsecurity THEN 'ENABLED ✓' ELSE 'DISABLED ✗' END;
  END LOOP;

  RAISE NOTICE '==============================================';
END $$;
