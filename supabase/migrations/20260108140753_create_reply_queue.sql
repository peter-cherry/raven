-- Create reply_queue table for AI auto-reply workflow
-- Stores incoming email replies and AI-generated response drafts for human review

CREATE TABLE IF NOT EXISTS public.reply_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cold_lead_id UUID REFERENCES public.cold_leads(id) ON DELETE CASCADE,

  -- Original incoming email
  original_subject TEXT,
  original_body TEXT NOT NULL,
  original_from TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- AI classification
  reply_type TEXT NOT NULL CHECK (reply_type IN ('positive', 'question', 'negative', 'spam', 'unknown')),
  classification_confidence REAL,
  classification_reason TEXT,

  -- AI-generated reply
  generated_subject TEXT,
  generated_body TEXT,
  generation_prompt TEXT,

  -- Editing and sending
  edited_body TEXT,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'sent', 'rejected')),
  sent_at TIMESTAMPTZ,
  sendgrid_message_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX idx_reply_queue_status ON public.reply_queue(status);
CREATE INDEX idx_reply_queue_cold_lead_id ON public.reply_queue(cold_lead_id);
CREATE INDEX idx_reply_queue_created_at ON public.reply_queue(created_at DESC);

-- Enable RLS
ALTER TABLE public.reply_queue ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for API routes)
CREATE POLICY "Service role has full access to reply_queue"
  ON public.reply_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.reply_queue IS 'Queue for AI-generated auto-replies to cold email responses. Human review required before sending.';
