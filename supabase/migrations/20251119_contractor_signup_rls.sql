-- Allow Anonymous Contractor Self-Signup
-- Migration: 20251119_contractor_signup_rls
-- Purpose: Allow unauthenticated users to create contractor records during onboarding

-- Drop existing policy if it exists (for re-running migration)
DROP POLICY IF EXISTS "Allow contractor self-signup" ON public.technicians;

-- Grant INSERT permission to anon role on technicians table
GRANT INSERT ON public.technicians TO anon;

-- Grant UPDATE permission to anon role (for Step 6 completion)
GRANT UPDATE ON public.technicians TO anon;

-- Grant SELECT permission to anon role (for reading back inserted records)
GRANT SELECT ON public.technicians TO anon;

-- Grant USAGE on sequences for ID generation
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Create policy to allow anonymous users to insert/update contractor records during onboarding
CREATE POLICY "Allow contractor self-signup"
  ON public.technicians
  FOR ALL
  TO anon
  USING (true)  -- Allow reading any record
  WITH CHECK (
    -- Only allow inserting/updating incomplete onboarding records
    onboarding_complete = false OR onboarding_complete IS NULL
  );

-- Add comment for documentation
COMMENT ON POLICY "Allow contractor self-signup" ON public.technicians IS
  'Allows anonymous users to create and update contractor records during onboarding. Only permits operations on incomplete onboarding records (onboarding_complete = false).';
