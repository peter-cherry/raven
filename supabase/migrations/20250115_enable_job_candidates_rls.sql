-- Enable RLS on job_candidates
ALTER TABLE job_candidates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view job_candidates from their org" ON job_candidates;

-- RLS Policy: Users can view job_candidates from their organization
CREATE POLICY "Users can view job_candidates from their org"
  ON job_candidates
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships 
      WHERE user_id = auth.uid()
    )
  );
