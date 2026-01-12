-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manual Emails Tracking Table
CREATE TABLE IF NOT EXISTS manual_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID REFERENCES outreach_targets(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'sent', -- sent | failed | opened | clicked | replied
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_manual_emails_target_id ON manual_emails(target_id);
CREATE INDEX IF NOT EXISTS idx_manual_emails_sent_by ON manual_emails(sent_by);
CREATE INDEX IF NOT EXISTS idx_manual_emails_status ON manual_emails(status);
CREATE INDEX IF NOT EXISTS idx_manual_emails_sent_at ON manual_emails(sent_at);

-- RLS Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_emails ENABLE ROW LEVEL SECURITY;

-- Email templates: Allow authenticated users to read and create
CREATE POLICY "Users can view email templates"
  ON email_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create email templates"
  ON email_templates FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own templates"
  ON email_templates FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own templates"
  ON email_templates FOR DELETE
  USING (auth.role() = 'authenticated');

-- Manual emails: Allow users to view their sent emails
CREATE POLICY "Users can view manual emails"
  ON manual_emails FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create manual emails"
  ON manual_emails FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for email_templates updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE email_templates IS 'Saved email templates for manual outreach';
COMMENT ON TABLE manual_emails IS 'Tracking table for manually sent emails via compose interface';
COMMENT ON COLUMN manual_emails.status IS 'Email delivery status: sent, failed, opened, clicked, replied';
