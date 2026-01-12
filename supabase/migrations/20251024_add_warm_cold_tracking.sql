-- Hybrid Dispatch System: Add warm/cold tracking
-- Enables SendGrid (warm) + Instantly (cold) dual-layer dispatch

-- Add warm/cold distinction to technicians table
ALTER TABLE technicians
  ADD COLUMN IF NOT EXISTS signed_up BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preferred_contact VARCHAR(10) CHECK (preferred_contact IN ('email', 'sms', 'both'));

-- Add comment for clarity
COMMENT ON COLUMN technicians.signed_up IS 'TRUE if technician has signed up and consented to receive job emails (warm), FALSE for cold outreach';
COMMENT ON COLUMN technicians.consent_date IS 'When the technician gave consent to receive job notifications';
COMMENT ON COLUMN technicians.preferred_contact IS 'Preferred contact method: email, sms, or both';

-- Update work_order_outreach table for separate warm/cold tracking
ALTER TABLE work_order_outreach
  ADD COLUMN IF NOT EXISTS warm_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS warm_opened INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS warm_replied INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS warm_qualified INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cold_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cold_opened INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cold_replied INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cold_qualified INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN work_order_outreach.warm_sent IS 'Number of warm (subscribed) technicians reached via SendGrid';
COMMENT ON COLUMN work_order_outreach.cold_sent IS 'Number of cold (first contact) technicians reached via Instantly';

-- Add dispatch_method to work_order_recipients
ALTER TABLE work_order_recipients
  ADD COLUMN IF NOT EXISTS dispatch_method VARCHAR(20) CHECK (dispatch_method IN ('sendgrid_warm', 'instantly_cold', 'sms'));

COMMENT ON COLUMN work_order_recipients.dispatch_method IS 'Method used to dispatch: sendgrid_warm for subscribed techs, instantly_cold for cold outreach, sms for text messages';

-- Create indexes for faster warm/cold lookups
CREATE INDEX IF NOT EXISTS idx_technicians_signed_up ON technicians(signed_up);
-- Note: Removed idx_technicians_status as 'status' column doesn't exist in technicians table
CREATE INDEX IF NOT EXISTS idx_work_order_recipients_dispatch_method ON work_order_recipients(dispatch_method);

-- Update the helper function to handle warm/cold stats
CREATE OR REPLACE FUNCTION update_outreach_stats(p_outreach_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_sent INTEGER;
  v_total_opened INTEGER;
  v_total_replied INTEGER;
  v_total_qualified INTEGER;
  v_warm_sent INTEGER;
  v_warm_opened INTEGER;
  v_warm_replied INTEGER;
  v_warm_qualified INTEGER;
  v_cold_sent INTEGER;
  v_cold_opened INTEGER;
  v_cold_replied INTEGER;
  v_cold_qualified INTEGER;
BEGIN
  -- Calculate overall stats
  SELECT
    COUNT(*) FILTER (WHERE email_sent = TRUE),
    COUNT(*) FILTER (WHERE email_opened = TRUE),
    COUNT(*) FILTER (WHERE reply_received = TRUE),
    COUNT(*) FILTER (WHERE ai_qualified = TRUE)
  INTO v_total_sent, v_total_opened, v_total_replied, v_total_qualified
  FROM work_order_recipients
  WHERE outreach_id = p_outreach_id;

  -- Calculate warm stats (SendGrid)
  SELECT
    COUNT(*) FILTER (WHERE email_sent = TRUE),
    COUNT(*) FILTER (WHERE email_opened = TRUE),
    COUNT(*) FILTER (WHERE reply_received = TRUE),
    COUNT(*) FILTER (WHERE ai_qualified = TRUE)
  INTO v_warm_sent, v_warm_opened, v_warm_replied, v_warm_qualified
  FROM work_order_recipients
  WHERE outreach_id = p_outreach_id
    AND dispatch_method = 'sendgrid_warm';

  -- Calculate cold stats (Instantly)
  SELECT
    COUNT(*) FILTER (WHERE email_sent = TRUE),
    COUNT(*) FILTER (WHERE email_opened = TRUE),
    COUNT(*) FILTER (WHERE reply_received = TRUE),
    COUNT(*) FILTER (WHERE ai_qualified = TRUE)
  INTO v_cold_sent, v_cold_opened, v_cold_replied, v_cold_qualified
  FROM work_order_recipients
  WHERE outreach_id = p_outreach_id
    AND dispatch_method = 'instantly_cold';

  -- Update outreach record with all stats
  UPDATE work_order_outreach
  SET
    emails_sent = v_total_sent,
    emails_opened = v_total_opened,
    replies_received = v_total_replied,
    qualified_count = v_total_qualified,
    warm_sent = v_warm_sent,
    warm_opened = v_warm_opened,
    warm_replied = v_warm_replied,
    warm_qualified = v_warm_qualified,
    cold_sent = v_cold_sent,
    cold_opened = v_cold_opened,
    cold_replied = v_cold_replied,
    cold_qualified = v_cold_qualified
  WHERE id = p_outreach_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_outreach_stats IS 'Updates work_order_outreach stats including warm/cold breakdown';

-- Helper function to increment warm opened counter
CREATE OR REPLACE FUNCTION increment_warm_opened(p_outreach_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE work_order_outreach
  SET
    warm_opened = warm_opened + 1,
    emails_opened = emails_opened + 1
  WHERE id = p_outreach_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to increment cold opened counter
CREATE OR REPLACE FUNCTION increment_cold_opened(p_outreach_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE work_order_outreach
  SET
    cold_opened = cold_opened + 1,
    emails_opened = emails_opened + 1
  WHERE id = p_outreach_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to increment warm replied counter
CREATE OR REPLACE FUNCTION increment_warm_replied(p_outreach_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE work_order_outreach
  SET
    warm_replied = warm_replied + 1,
    replies_received = replies_received + 1
  WHERE id = p_outreach_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to increment cold replied counter
CREATE OR REPLACE FUNCTION increment_cold_replied(p_outreach_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE work_order_outreach
  SET
    cold_replied = cold_replied + 1,
    replies_received = replies_received + 1
  WHERE id = p_outreach_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
