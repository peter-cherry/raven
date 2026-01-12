-- Drop existing RLS policies on jobs table
DROP POLICY IF EXISTS "Users can view jobs from their org" ON jobs;
DROP POLICY IF EXISTS "Users can create jobs in their org" ON jobs;
DROP POLICY IF EXISTS "Users can update jobs in their org" ON jobs;

-- Temporarily disable RLS on jobs table for testing
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
