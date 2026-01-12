-- Cold Leads Table
-- Stores leads found via Instantly SuperSearch for cold outreach
-- Tracks dispatch history and conversion metrics

CREATE TABLE IF NOT EXISTS public.cold_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source tracking
  supersearch_query TEXT NOT NULL,
  supersearch_resource_id TEXT,

  -- Lead data from SuperSearch
  email TEXT NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  job_title TEXT,
  phone TEXT,
  linkedin_url TEXT,
  website TEXT,

  -- Location
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',

  -- Trade classification
  trade_type TEXT,  -- HVAC, Plumbing, Electrical, etc.

  -- Enrichment status
  email_verified BOOLEAN DEFAULT false,
  enrichment_credits_used DECIMAL(10,2),

  -- Dispatch tracking
  first_dispatched_at TIMESTAMPTZ,
  last_dispatched_at TIMESTAMPTZ,
  dispatch_count INTEGER DEFAULT 0,

  -- Response tracking
  has_replied BOOLEAN DEFAULT false,
  reply_received_at TIMESTAMPTZ,
  has_signed_up BOOLEAN DEFAULT false,  -- Converted to warm lead
  signed_up_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_cold_lead_email UNIQUE (email)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_cold_leads_trade_location ON cold_leads(trade_type, state, city);
CREATE INDEX IF NOT EXISTS idx_cold_leads_query ON cold_leads(supersearch_query);
CREATE INDEX IF NOT EXISTS idx_cold_leads_email ON cold_leads(email);
CREATE INDEX IF NOT EXISTS idx_cold_leads_dispatch ON cold_leads(last_dispatched_at);

-- Add source tracking to work_order_recipients
ALTER TABLE work_order_recipients
ADD COLUMN IF NOT EXISTS lead_source TEXT DEFAULT 'warm',  -- 'warm' | 'cold_supersearch'
ADD COLUMN IF NOT EXISTS cold_lead_id UUID REFERENCES cold_leads(id);

-- Create index for cold lead lookups
CREATE INDEX IF NOT EXISTS idx_recipients_cold_lead ON work_order_recipients(cold_lead_id) WHERE cold_lead_id IS NOT NULL;

-- Enable RLS
ALTER TABLE cold_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies - service role can do everything
CREATE POLICY "Service role full access to cold_leads" ON cold_leads
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comment for documentation
COMMENT ON TABLE cold_leads IS 'Leads found via Instantly SuperSearch for cold outreach campaigns';
COMMENT ON COLUMN cold_leads.supersearch_query IS 'Natural language query used to find this lead';
COMMENT ON COLUMN cold_leads.trade_type IS 'Trade classification: HVAC, Plumbing, Electrical, etc.';
COMMENT ON COLUMN cold_leads.has_signed_up IS 'True when lead converts to registered technician (warm)';
