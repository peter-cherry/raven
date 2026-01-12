-- Outreach schema for campaigns across four trades
-- Tables
CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed')),
  target_trade TEXT[] NOT NULL,
  target_states TEXT[],
  target_cities TEXT[],
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL,
  total_targets INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  signups_generated INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS outreach_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  business_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  city TEXT,
  state TEXT,
  address TEXT,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('Handyman','HVAC','Plumbing','Electrical')),
  email_found BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  email_source TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','queued','sent','opened','clicked','replied','signed_up','unsubscribed','bounced','failed'
  )),
  first_sent_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  signed_up_at TIMESTAMPTZ,
  emails_sent_count INTEGER DEFAULT 0,
  last_email_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_outreach_targets_campaign ON outreach_targets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_targets_status ON outreach_targets(status);
CREATE INDEX IF NOT EXISTS idx_outreach_targets_email ON outreach_targets(email);
CREATE INDEX IF NOT EXISTS idx_outreach_targets_trade ON outreach_targets(trade_type);

CREATE TABLE IF NOT EXISTS outreach_email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 3,
  subject_line TEXT NOT NULL,
  email_body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outreach_sent_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES outreach_campaigns(id),
  target_id UUID REFERENCES outreach_targets(id) ON DELETE CASCADE,
  sequence_step INTEGER NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  message_id TEXT UNIQUE,
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  opened BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  bounced BOOLEAN DEFAULT false,
  error_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_sent_emails_target ON outreach_sent_emails(target_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_message_id ON outreach_sent_emails(message_id);

CREATE TABLE IF NOT EXISTS outreach_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  reason TEXT,
  user_agent TEXT,
  ip_address TEXT,
  unsubscribed_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_unsubscribes_email ON outreach_unsubscribes(email);

CREATE TABLE IF NOT EXISTS outreach_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_email_id UUID REFERENCES outreach_sent_emails(id) ON DELETE CASCADE,
  target_id UUID REFERENCES outreach_targets(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('open','click','reply','bounce')),
  clicked_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tracking_events_sent_email ON outreach_tracking_events(sent_email_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_type ON outreach_tracking_events(event_type);

CREATE TABLE IF NOT EXISTS email_enrichment_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID REFERENCES outreach_targets(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  emails_found JSONB,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Triggers to update targets on open/click
CREATE OR REPLACE FUNCTION update_target_on_open()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE outreach_targets
  SET status = CASE WHEN status = 'sent' THEN 'opened' ELSE status END,
      opened_at = COALESCE(opened_at, NEW.created_at)
  WHERE id = NEW.target_id;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_target_on_open ON outreach_tracking_events;
CREATE TRIGGER trigger_update_target_on_open
  AFTER INSERT ON outreach_tracking_events
  FOR EACH ROW
  WHEN (NEW.event_type = 'open')
  EXECUTE FUNCTION update_target_on_open();

CREATE OR REPLACE FUNCTION update_target_on_click()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE outreach_targets
  SET status = CASE WHEN status IN ('sent','opened') THEN 'clicked' ELSE status END,
      clicked_at = COALESCE(clicked_at, NEW.created_at)
  WHERE id = NEW.target_id;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_target_on_click ON outreach_tracking_events;
CREATE TRIGGER trigger_update_target_on_click
  AFTER INSERT ON outreach_tracking_events
  FOR EACH ROW
  WHEN (NEW.event_type = 'click')
  EXECUTE FUNCTION update_target_on_click();

-- View: campaign performance by trade
CREATE OR REPLACE VIEW campaign_performance_by_trade AS
SELECT 
  c.id AS campaign_id,
  c.name AS campaign_name,
  t.trade_type,
  COUNT(*) AS total_targets,
  COUNT(CASE WHEN t.email_found THEN 1 END) AS emails_found,
  COUNT(CASE WHEN t.status = 'sent' THEN 1 END) AS emails_sent,
  COUNT(CASE WHEN t.status = 'opened' THEN 1 END) AS opened,
  COUNT(CASE WHEN t.status = 'clicked' THEN 1 END) AS clicked,
  COUNT(CASE WHEN t.status = 'signed_up' THEN 1 END) AS signups,
  ROUND((COUNT(CASE WHEN t.status = 'signed_up' THEN 1 END)::numeric / NULLIF(COUNT(CASE WHEN t.status = 'sent' THEN 1 END), 0)) * 100, 2) AS conversion_rate
FROM outreach_campaigns c
LEFT JOIN outreach_targets t ON t.campaign_id = c.id
GROUP BY c.id, c.name, t.trade_type
ORDER BY c.created_at DESC, t.trade_type;
