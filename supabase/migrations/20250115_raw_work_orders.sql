-- Raw Work Orders Table for Email Parsing
-- Stores unstructured work order strings from emails/external sources
-- These are later parsed and converted into structured job records

CREATE TABLE IF NOT EXISTS raw_work_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  source TEXT DEFAULT 'email',
  status TEXT DEFAULT 'pending',
  parsed_data JSONB,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE raw_work_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see raw work orders from their organization
CREATE POLICY "Users can view raw work orders from their org"
  ON raw_work_orders
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can create raw work orders in their org
CREATE POLICY "Users can create raw work orders in their org"
  ON raw_work_orders
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update raw work orders in their org
CREATE POLICY "Users can update raw work orders in their org"
  ON raw_work_orders
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX idx_raw_work_orders_org_id ON raw_work_orders(org_id);
CREATE INDEX idx_raw_work_orders_status ON raw_work_orders(status);
CREATE INDEX idx_raw_work_orders_created_at ON raw_work_orders(created_at DESC);
CREATE INDEX idx_raw_work_orders_job_id ON raw_work_orders(job_id);
