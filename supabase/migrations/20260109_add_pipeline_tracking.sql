-- Add pipeline tracking columns to work_order_outreach table
-- These columns track the automated lead pipeline that runs when no warm technicians are available

ALTER TABLE work_order_outreach
ADD COLUMN IF NOT EXISTS pipeline_ran BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pipeline_selected INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pipeline_verified INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pipeline_moved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pipeline_credits_used INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN work_order_outreach.pipeline_ran IS 'Whether the automated lead pipeline ran for this outreach';
COMMENT ON COLUMN work_order_outreach.pipeline_selected IS 'Number of contractors AI-selected from license_records';
COMMENT ON COLUMN work_order_outreach.pipeline_verified IS 'Number of contractors with verified emails via Hunter.io';
COMMENT ON COLUMN work_order_outreach.pipeline_moved IS 'Number of contractors moved to cold_leads table';
COMMENT ON COLUMN work_order_outreach.pipeline_credits_used IS 'Hunter.io credits used during verification';
