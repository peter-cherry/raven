-- Admin Outreach System
-- Cold outreach to technicians via email campaigns

-- Outreach targets (technicians to reach out to)
CREATE TABLE outreach_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  phone TEXT,
  state TEXT,
  trade TEXT,
  source TEXT, -- 'scraping', 'manual', 'import'
  enrichment_status TEXT DEFAULT 'pending', -- 'pending', 'enriching', 'completed', 'failed'
  enriched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(email)
);

-- Outreach campaigns
CREATE TABLE outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  instantly_campaign_id TEXT,
  trade_filter TEXT, -- 'HVAC', 'Plumbing', 'Electrical', etc.
  state_filter TEXT[],
  total_targets INTEGER NOT NULL DEFAULT 0,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_opened INTEGER NOT NULL DEFAULT 0,
  replies_received INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign recipients (many-to-many)
CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES outreach_targets(id) ON DELETE CASCADE,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  email_opened BOOLEAN DEFAULT FALSE,
  email_opened_at TIMESTAMPTZ,
  replied BOOLEAN DEFAULT FALSE,
  replied_at TIMESTAMPTZ,
  reply_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, target_id)
);

-- Scraping activity log
CREATE TABLE scraping_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'google', 'yelp', 'thumbtack', etc.
  trade TEXT NOT NULL,
  state TEXT NOT NULL,
  query TEXT,
  results_found INTEGER NOT NULL DEFAULT 0,
  new_targets INTEGER NOT NULL DEFAULT 0,
  duplicate_targets INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enrichment queue
CREATE TABLE enrichment_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL REFERENCES outreach_targets(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(target_id)
);

-- Indexes for performance
CREATE INDEX idx_outreach_targets_email ON outreach_targets(email);
CREATE INDEX idx_outreach_targets_trade ON outreach_targets(trade);
CREATE INDEX idx_outreach_targets_state ON outreach_targets(state);
CREATE INDEX idx_outreach_targets_enrichment ON outreach_targets(enrichment_status);
CREATE INDEX idx_outreach_campaigns_status ON outreach_campaigns(status);
CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_target ON campaign_recipients(target_id);
CREATE INDEX idx_scraping_activity_created ON scraping_activity(created_at DESC);
CREATE INDEX idx_enrichment_queue_priority ON enrichment_queue(priority DESC, created_at ASC);

-- RLS Policies
ALTER TABLE outreach_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_queue ENABLE ROW LEVEL SECURITY;

-- Admin-only access for all outreach tables
CREATE POLICY "Admins can view outreach_targets"
  ON outreach_targets FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage outreach_targets"
  ON outreach_targets FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can view outreach_campaigns"
  ON outreach_campaigns FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage outreach_campaigns"
  ON outreach_campaigns FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can view campaign_recipients"
  ON campaign_recipients FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage campaign_recipients"
  ON campaign_recipients FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can view scraping_activity"
  ON scraping_activity FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage scraping_activity"
  ON scraping_activity FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can view enrichment_queue"
  ON enrichment_queue FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage enrichment_queue"
  ON enrichment_queue FOR ALL
  USING (is_admin());

-- Helper function to get campaign stats
CREATE OR REPLACE FUNCTION get_campaign_stats(p_campaign_id UUID)
RETURNS TABLE (
  total_targets INTEGER,
  emails_sent INTEGER,
  emails_opened INTEGER,
  replies_received INTEGER,
  open_rate NUMERIC,
  reply_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_targets,
    COUNT(*) FILTER (WHERE email_sent = TRUE)::INTEGER as emails_sent,
    COUNT(*) FILTER (WHERE email_opened = TRUE)::INTEGER as emails_opened,
    COUNT(*) FILTER (WHERE replied = TRUE)::INTEGER as replies_received,
    CASE
      WHEN COUNT(*) FILTER (WHERE email_sent = TRUE) > 0
      THEN ROUND((COUNT(*) FILTER (WHERE email_opened = TRUE)::NUMERIC / COUNT(*) FILTER (WHERE email_sent = TRUE)::NUMERIC) * 100, 2)
      ELSE 0
    END as open_rate,
    CASE
      WHEN COUNT(*) FILTER (WHERE email_opened = TRUE) > 0
      THEN ROUND((COUNT(*) FILTER (WHERE replied = TRUE)::NUMERIC / COUNT(*) FILTER (WHERE email_opened = TRUE)::NUMERIC) * 100, 2)
      ELSE 0
    END as reply_rate
  FROM campaign_recipients
  WHERE campaign_id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at columns
CREATE TRIGGER update_outreach_targets_updated_at
  BEFORE UPDATE ON outreach_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outreach_campaigns_updated_at
  BEFORE UPDATE ON outreach_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
