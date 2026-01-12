-- Disable RLS on raw_work_orders for testing
ALTER TABLE raw_work_orders DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies
DROP POLICY IF EXISTS "Users can view raw work orders from their org" ON raw_work_orders;
DROP POLICY IF EXISTS "Users can create raw work orders in their org" ON raw_work_orders;
DROP POLICY IF EXISTS "Users can update raw work orders in their org" ON raw_work_orders;
