-- License Records Staging Table
-- Stores contractor license data imported from state licensing boards
-- Used for AI selection, email verification, and movement to cold_leads

CREATE TABLE IF NOT EXISTS public.license_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source tracking
  source TEXT NOT NULL,  -- 'cslb' (California), 'dbpr' (Florida), etc.
  license_number TEXT NOT NULL,
  license_status TEXT DEFAULT 'active',
  license_classification TEXT,
  license_expiration DATE,

  -- Business info
  business_name TEXT,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  job_title TEXT,

  -- Contact info
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,

  -- Trade classification
  trade_type TEXT,  -- HVAC, Plumbing, Electrical, General

  -- AI selection tracking
  ai_selected BOOLEAN DEFAULT false,
  ai_score DECIMAL(5,2),
  ai_selection_reason TEXT,
  selected_for_job_id UUID,

  -- Email verification tracking (Hunter.io)
  email TEXT,
  email_verified BOOLEAN DEFAULT false,
  email_verification_date TIMESTAMPTZ,
  hunter_confidence INTEGER,

  -- Movement to cold_leads tracking
  moved_to_cold_leads BOOLEAN DEFAULT false,
  cold_lead_id UUID REFERENCES cold_leads(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per source
  CONSTRAINT unique_license_per_source UNIQUE (source, license_number)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_license_records_source ON license_records(source);
CREATE INDEX IF NOT EXISTS idx_license_records_trade ON license_records(trade_type);
CREATE INDEX IF NOT EXISTS idx_license_records_state ON license_records(state);
CREATE INDEX IF NOT EXISTS idx_license_records_ai_selected ON license_records(ai_selected);
CREATE INDEX IF NOT EXISTS idx_license_records_email_verified ON license_records(email_verified);
CREATE INDEX IF NOT EXISTS idx_license_records_moved ON license_records(moved_to_cold_leads);

-- Enable RLS
ALTER TABLE license_records ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role has full access
CREATE POLICY "Service role full access to license_records" ON license_records
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON TABLE license_records IS 'Staging table for contractor license data from state boards';
COMMENT ON COLUMN license_records.source IS 'Source identifier: cslb (California), dbpr (Florida), etc.';
COMMENT ON COLUMN license_records.ai_selected IS 'Whether AI has selected this contractor for outreach';
COMMENT ON COLUMN license_records.hunter_confidence IS 'Hunter.io email confidence score (0-100)';
COMMENT ON COLUMN license_records.moved_to_cold_leads IS 'Whether this record has been moved to cold_leads table';
