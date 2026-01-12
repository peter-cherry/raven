-- Dispatch System for sending work orders to technicians via email
-- Tracks email delivery, opens, replies, and AI qualification

-- Main outreach campaign tracking
CREATE TABLE work_order_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_opened INTEGER NOT NULL DEFAULT 0,
  replies_received INTEGER NOT NULL DEFAULT 0,
  qualified_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(job_id) -- One outreach per job
);

-- Individual recipient tracking
CREATE TABLE work_order_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_id UUID NOT NULL REFERENCES work_order_outreach(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  email_opened BOOLEAN DEFAULT FALSE,
  email_opened_at TIMESTAMPTZ,
  reply_received BOOLEAN DEFAULT FALSE,
  reply_received_at TIMESTAMPTZ,
  reply_text TEXT,
  ai_qualified BOOLEAN DEFAULT FALSE,
  ai_qualification_result JSONB,
  ai_conversation_id UUID, -- For linking to AI conversation thread
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(outreach_id, technician_id)
);

-- AI conversation threads with technicians
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES work_order_recipients(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'qualified', 'disqualified', 'completed'
  messages JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array of {role, content, timestamp}
  qualification_score NUMERIC,
  qualification_reasons JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_work_order_outreach_job ON work_order_outreach(job_id);
CREATE INDEX idx_work_order_outreach_status ON work_order_outreach(status);
CREATE INDEX idx_work_order_recipients_outreach ON work_order_recipients(outreach_id);
CREATE INDEX idx_work_order_recipients_tech ON work_order_recipients(technician_id);
CREATE INDEX idx_work_order_recipients_opened ON work_order_recipients(email_opened) WHERE email_opened = TRUE;
CREATE INDEX idx_work_order_recipients_replied ON work_order_recipients(reply_received) WHERE reply_received = TRUE;
CREATE INDEX idx_ai_conversations_job ON ai_conversations(job_id);
CREATE INDEX idx_ai_conversations_tech ON ai_conversations(technician_id);
CREATE INDEX idx_ai_conversations_status ON ai_conversations(status);

-- RLS Policies
ALTER TABLE work_order_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Users can view outreach for jobs in their organization
CREATE POLICY "Users can view work_order_outreach in their org"
  ON work_order_outreach FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      INNER JOIN org_memberships om ON j.org_id = om.org_id
      WHERE j.id = work_order_outreach.job_id
        AND om.user_id = auth.uid()
    )
  );

-- Users can create outreach for jobs in their organization
CREATE POLICY "Users can create work_order_outreach in their org"
  ON work_order_outreach FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs j
      INNER JOIN org_memberships om ON j.org_id = om.org_id
      WHERE j.id = job_id
        AND om.user_id = auth.uid()
    )
  );

-- Users can view recipients for outreach in their organization
CREATE POLICY "Users can view work_order_recipients in their org"
  ON work_order_recipients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_order_outreach wo
      INNER JOIN jobs j ON wo.job_id = j.id
      INNER JOIN org_memberships om ON j.org_id = om.org_id
      WHERE wo.id = work_order_recipients.outreach_id
        AND om.user_id = auth.uid()
    )
  );

-- Users can view AI conversations for jobs in their organization
CREATE POLICY "Users can view ai_conversations in their org"
  ON ai_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      INNER JOIN org_memberships om ON j.org_id = om.org_id
      WHERE j.id = ai_conversations.job_id
        AND om.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_work_order_recipients_updated_at
  BEFORE UPDATE ON work_order_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function to update outreach stats
CREATE OR REPLACE FUNCTION update_outreach_stats(p_outreach_id UUID)
RETURNS VOID AS $$
DECLARE
  v_sent INTEGER;
  v_opened INTEGER;
  v_replied INTEGER;
  v_qualified INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE email_sent = TRUE),
    COUNT(*) FILTER (WHERE email_opened = TRUE),
    COUNT(*) FILTER (WHERE reply_received = TRUE),
    COUNT(*) FILTER (WHERE ai_qualified = TRUE)
  INTO v_sent, v_opened, v_replied, v_qualified
  FROM work_order_recipients
  WHERE outreach_id = p_outreach_id;

  UPDATE work_order_outreach
  SET
    emails_sent = v_sent,
    emails_opened = v_opened,
    replies_received = v_replied,
    qualified_count = v_qualified
  WHERE id = p_outreach_id;
END;
$$ LANGUAGE plpgsql;
