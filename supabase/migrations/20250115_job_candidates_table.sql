-- Drop existing table if it exists
DROP TABLE IF EXISTS job_candidates CASCADE;

-- Job Candidates Table
-- Stores technician matches for each job based on location and skills
CREATE TABLE job_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  distance_m NUMERIC,
  duration_sec NUMERIC,
  match_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_job_candidates_org_id ON job_candidates(org_id);
CREATE INDEX idx_job_candidates_job_id ON job_candidates(job_id);
CREATE INDEX idx_job_candidates_technician_id ON job_candidates(technician_id);

-- Find Matching Technicians RPC
-- This function finds technicians matching a job's trade and location
CREATE OR REPLACE FUNCTION find_matching_technicians(p_job_id UUID)
RETURNS TABLE(candidate_id UUID, job_id UUID, technician_id UUID, distance_m NUMERIC, duration_sec NUMERIC) AS $$
BEGIN
  -- For now, return empty result set
  -- In production, this would use PostGIS and Google Maps API
  RETURN QUERY
  SELECT 
    gen_random_uuid(),
    p_job_id,
    t.id,
    NULL::NUMERIC,
    NULL::NUMERIC
  FROM technicians t
  LIMIT 0;
END;
$$ LANGUAGE plpgsql;
