-- Migration: Create Admin Activity and Outreach Tables
-- Date: 2025-01-14
-- Purpose: Create missing tables for admin Activity and Outreach pages

-- =====================================================
-- 1. OUTREACH CAMPAIGNS TABLE
-- =====================================================
-- Stores email campaign configurations and analytics
-- Integrates with Instantly.ai API

CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  instantly_campaign_id TEXT UNIQUE NOT NULL,

  -- Targeting filters
  trade_filter TEXT[],  -- Array of trades to target (e.g., ['Electrical', 'HVAC'])
  state_filter TEXT[],  -- Array of states (e.g., ['CA', 'NY'])
  city_filter TEXT[],

  -- Campaign stats (synced from Instantly.ai)
  total_targets INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  replies_received INTEGER DEFAULT 0,
  bounced INTEGER DEFAULT 0,
  unsubscribed INTEGER DEFAULT 0,

  -- Campaign status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE,

  -- Campaign settings
  daily_send_limit INTEGER DEFAULT 50,
  email_template_subject TEXT,
  email_template_body TEXT
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_status ON outreach_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_created_at ON outreach_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_instantly_id ON outreach_campaigns(instantly_campaign_id);

-- Row Level Security
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;

-- Admin users can do everything
CREATE POLICY "Admin users can manage campaigns" ON outreach_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- =====================================================
-- 2. OUTREACH TARGETS TABLE
-- =====================================================
-- Stores contact leads for email outreach campaigns

CREATE TABLE IF NOT EXISTS outreach_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact information
  email TEXT NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,

  -- Business information
  company TEXT,
  trade TEXT NOT NULL,  -- Primary trade (Electrical, HVAC, Plumbing, etc.)
  additional_trades TEXT[],  -- Additional services

  -- Location
  state TEXT NOT NULL,
  city TEXT,
  zip_code TEXT,
  address TEXT,

  -- Contact details
  phone TEXT,
  website TEXT,

  -- Enrichment status
  enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'enriched', 'failed', 'verified')),
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,

  -- Campaign tracking
  added_to_campaigns UUID[],  -- Array of campaign IDs this target was added to
  last_contacted_at TIMESTAMP WITH TIME ZONE,

  -- Lead scoring
  lead_score INTEGER DEFAULT 0,  -- 0-100 score based on enrichment quality

  -- Source tracking
  source TEXT,  -- Where we found this lead (e.g., 'google_maps', 'yelp', 'manual')
  source_url TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicates
  UNIQUE(email)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_outreach_targets_email ON outreach_targets(email);
CREATE INDEX IF NOT EXISTS idx_outreach_targets_trade ON outreach_targets(trade);
CREATE INDEX IF NOT EXISTS idx_outreach_targets_state ON outreach_targets(state);
CREATE INDEX IF NOT EXISTS idx_outreach_targets_city ON outreach_targets(city);
CREATE INDEX IF NOT EXISTS idx_outreach_targets_enrichment ON outreach_targets(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_outreach_targets_created_at ON outreach_targets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_targets_lead_score ON outreach_targets(lead_score DESC);

-- Row Level Security
ALTER TABLE outreach_targets ENABLE ROW LEVEL SECURITY;

-- Admin users can manage targets
CREATE POLICY "Admin users can manage targets" ON outreach_targets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. SCRAPING ACTIVITY TABLE
-- =====================================================
-- Stores logs of scraping jobs and their results

CREATE TABLE IF NOT EXISTS scraping_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scraping job details
  source TEXT NOT NULL,  -- 'google_maps', 'yelp', 'yellowpages', etc.
  trade TEXT NOT NULL,   -- Trade being scraped
  state TEXT,            -- Target state
  city TEXT,             -- Target city
  query TEXT,            -- Search query used

  -- Results
  results_found INTEGER DEFAULT 0,      -- Total results found
  new_targets INTEGER DEFAULT 0,        -- New unique targets added
  duplicate_targets INTEGER DEFAULT 0,  -- Duplicates skipped
  failed_targets INTEGER DEFAULT 0,     -- Targets that failed to process

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  error_message TEXT,

  -- Performance metrics
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,

  -- Configuration
  max_results INTEGER DEFAULT 100,  -- Maximum results to scrape
  pagination_offset INTEGER DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_scraping_activity_source ON scraping_activity(source);
CREATE INDEX IF NOT EXISTS idx_scraping_activity_trade ON scraping_activity(trade);
CREATE INDEX IF NOT EXISTS idx_scraping_activity_status ON scraping_activity(status);
CREATE INDEX IF NOT EXISTS idx_scraping_activity_started_at ON scraping_activity(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraping_activity_created_by ON scraping_activity(created_by);

-- Row Level Security
ALTER TABLE scraping_activity ENABLE ROW LEVEL SECURITY;

-- Admin users can view all scraping activity
CREATE POLICY "Admin users can view scraping activity" ON scraping_activity
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Admin users can create scraping jobs
CREATE POLICY "Admin users can create scraping jobs" ON scraping_activity
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Admin users can update their own scraping jobs
CREATE POLICY "Admin users can update scraping jobs" ON scraping_activity
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update updated_at timestamp on outreach_campaigns
CREATE OR REPLACE FUNCTION update_outreach_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_outreach_campaigns_updated_at
  BEFORE UPDATE ON outreach_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_outreach_campaigns_updated_at();

-- Update updated_at timestamp on outreach_targets
CREATE OR REPLACE FUNCTION update_outreach_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_outreach_targets_updated_at
  BEFORE UPDATE ON outreach_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_outreach_targets_updated_at();

-- Calculate scraping duration on completion
CREATE OR REPLACE FUNCTION calculate_scraping_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_scraping_duration
  BEFORE UPDATE ON scraping_activity
  FOR EACH ROW
  WHEN (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION calculate_scraping_duration();

-- =====================================================
-- 5. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE outreach_campaigns IS 'Email campaign configurations integrated with Instantly.ai';
COMMENT ON TABLE outreach_targets IS 'Contact leads for email outreach campaigns';
COMMENT ON TABLE scraping_activity IS 'Logs of web scraping jobs for finding contractor contacts';

COMMENT ON COLUMN outreach_campaigns.instantly_campaign_id IS 'Campaign ID from Instantly.ai API';
COMMENT ON COLUMN outreach_campaigns.last_synced_at IS 'Last time stats were synced from Instantly.ai';
COMMENT ON COLUMN outreach_targets.enrichment_status IS 'Status of email/phone verification from Hunter.io';
COMMENT ON COLUMN outreach_targets.lead_score IS 'Quality score 0-100 based on data completeness';
COMMENT ON COLUMN scraping_activity.duration_seconds IS 'Auto-calculated duration of scraping job';
