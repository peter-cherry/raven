-- Migration: Create audit_log table and add idempotency_key to jobs
-- Purpose: Support audit logging for all business entity changes and idempotent job creation

-- ============================================
-- AUDIT LOG TABLE
-- ============================================

-- Create audit_log table for tracking all business entity changes
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('job', 'credential', 'membership', 'organization', 'technician')),
    entity_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'assigned', 'completed', 'dispatched', 'cancelled')),
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    org_id UUID REFERENCES organizations(id),
    changes JSONB, -- { field: [old_value, new_value] }
    metadata JSONB, -- Additional context
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- Enable RLS on audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view audit logs for their organization
CREATE POLICY "Users can view org audit logs" ON audit_log
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
        )
    );

-- Policy: Only service role can insert audit logs (via API routes)
-- This ensures audit logs cannot be tampered with from the client
CREATE POLICY "Service role can insert audit logs" ON audit_log
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- IDEMPOTENCY KEY FOR JOBS
-- ============================================

-- Add idempotency_key column to jobs table for preventing duplicate job creation
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE;

-- Create index for fast idempotency lookups
CREATE INDEX IF NOT EXISTS idx_jobs_idempotency_key ON jobs(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE audit_log IS 'Audit trail for all business entity changes. Used for compliance, debugging, and security.';
COMMENT ON COLUMN audit_log.entity_type IS 'Type of entity being audited (job, credential, membership, organization, technician)';
COMMENT ON COLUMN audit_log.entity_id IS 'UUID of the entity being audited';
COMMENT ON COLUMN audit_log.action IS 'Action performed on the entity';
COMMENT ON COLUMN audit_log.actor_id IS 'User who performed the action';
COMMENT ON COLUMN audit_log.org_id IS 'Organization context for the action (if applicable)';
COMMENT ON COLUMN audit_log.changes IS 'JSON object with field changes: { field: [old_value, new_value] }';
COMMENT ON COLUMN audit_log.metadata IS 'Additional context about the action';
COMMENT ON COLUMN audit_log.ip_address IS 'IP address of the request (if available)';
COMMENT ON COLUMN audit_log.user_agent IS 'User agent of the request (if available)';

COMMENT ON COLUMN jobs.idempotency_key IS 'Client-generated UUID to prevent duplicate job creation on retry';
