-- Increment functions for outreach stats
-- Called by reply polling cron job

-- Generic increment function for any numeric column
CREATE OR REPLACE FUNCTION increment(x integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT x + 1;
$$;

-- Increment warm_replied count
CREATE OR REPLACE FUNCTION increment_warm_replied(p_outreach_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE work_order_outreach
  SET warm_replied = COALESCE(warm_replied, 0) + 1,
      updated_at = NOW()
  WHERE id = p_outreach_id;
END;
$$;

-- Increment cold_replied count
CREATE OR REPLACE FUNCTION increment_cold_replied(p_outreach_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE work_order_outreach
  SET cold_replied = COALESCE(cold_replied, 0) + 1,
      updated_at = NOW()
  WHERE id = p_outreach_id;
END;
$$;

-- Increment warm_qualified count
CREATE OR REPLACE FUNCTION increment_warm_qualified(p_outreach_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE work_order_outreach
  SET warm_qualified = COALESCE(warm_qualified, 0) + 1,
      updated_at = NOW()
  WHERE id = p_outreach_id;
END;
$$;

-- Increment cold_qualified count
CREATE OR REPLACE FUNCTION increment_cold_qualified(p_outreach_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE work_order_outreach
  SET cold_qualified = COALESCE(cold_qualified, 0) + 1,
      updated_at = NOW()
  WHERE id = p_outreach_id;
END;
$$;

-- Increment warm_opened count
CREATE OR REPLACE FUNCTION increment_warm_opened(p_outreach_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE work_order_outreach
  SET warm_opened = COALESCE(warm_opened, 0) + 1,
      updated_at = NOW()
  WHERE id = p_outreach_id;
END;
$$;

-- Increment cold_opened count
CREATE OR REPLACE FUNCTION increment_cold_opened(p_outreach_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE work_order_outreach
  SET cold_opened = COALESCE(cold_opened, 0) + 1,
      updated_at = NOW()
  WHERE id = p_outreach_id;
END;
$$;

-- Add qualification columns to work_order_recipients if they don't exist
ALTER TABLE work_order_recipients
ADD COLUMN IF NOT EXISTS reply_text TEXT,
ADD COLUMN IF NOT EXISTS reply_received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_qualified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS qualification_reason TEXT,
ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ;

-- Create index for faster qualification lookups
CREATE INDEX IF NOT EXISTS idx_recipients_qualified ON work_order_recipients(ai_qualified) WHERE ai_qualified = true;

-- Comment for documentation
COMMENT ON FUNCTION increment_warm_replied IS 'Increments warm reply count for an outreach record';
COMMENT ON FUNCTION increment_cold_replied IS 'Increments cold reply count for an outreach record';
