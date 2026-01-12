-- Jobs Table
-- Main table for structured job/work order records

CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  description TEXT,
  trade_needed TEXT NOT NULL,
  required_certifications TEXT[] DEFAULT '{}',
  address_text TEXT NOT NULL,
  city TEXT,
  state TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  scheduled_at TIMESTAMP,
  duration TEXT,
  urgency TEXT DEFAULT 'within_week',
  budget_min NUMERIC,
  budget_max NUMERIC,
  pay_rate TEXT,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  job_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view jobs from their organization
CREATE POLICY "Users can view jobs from their org"
  ON jobs
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can create jobs in their org
CREATE POLICY "Users can create jobs in their org"
  ON jobs
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update jobs in their org
CREATE POLICY "Users can update jobs in their org"
  ON jobs
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_org_id ON jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(job_status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_trade_needed ON jobs(trade_needed);
