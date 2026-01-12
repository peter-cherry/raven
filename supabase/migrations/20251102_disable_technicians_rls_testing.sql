-- Temporarily disable RLS on technicians table for testing
ALTER TABLE technicians DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policy
DROP POLICY IF EXISTS "Users can view technicians from their org" ON technicians;
