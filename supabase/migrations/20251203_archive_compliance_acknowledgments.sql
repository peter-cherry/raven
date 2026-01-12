-- Migration: Archive Compliance Acknowledgments Before Deletion
-- Created: 2025-12-03
-- Purpose: Automatically archive compliance records before CASCADE delete
--          Keeps main table clean while preserving legal audit trail forever

-- =====================================================
-- 1. Create Archive Table
-- =====================================================
-- This table stores compliance acknowledgments that would otherwise
-- be deleted via CASCADE when users/orgs are removed.
-- Records here are PERMANENT and should NEVER be deleted.

CREATE TABLE IF NOT EXISTS public.compliance_acknowledgments_archive (
  -- Original record ID (for reference)
  original_id UUID NOT NULL,

  -- Organization info (stored as values, not FK)
  organization_id UUID,  -- Original org ID (for reference only)
  organization_name TEXT,  -- Captured at archive time

  -- User info (stored as values, not FK)
  user_id UUID,  -- Original user ID (for reference only)
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,

  -- Audit trail (copied from original)
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL,
  policy_version TEXT NOT NULL,
  agreement_version TEXT NOT NULL,
  full_agreement_text TEXT NOT NULL,

  -- Archive metadata
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archive_reason TEXT NOT NULL,  -- 'user_deleted', 'org_deleted', 'manual'

  -- Primary key on archive
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Index for lookups
  CONSTRAINT unique_original_id UNIQUE (original_id)
);

-- Indexes for searching archived records
CREATE INDEX IF NOT EXISTS idx_archive_org_id ON public.compliance_acknowledgments_archive(organization_id);
CREATE INDEX IF NOT EXISTS idx_archive_user_id ON public.compliance_acknowledgments_archive(user_id);
CREATE INDEX IF NOT EXISTS idx_archive_user_email ON public.compliance_acknowledgments_archive(user_email);
CREATE INDEX IF NOT EXISTS idx_archive_acknowledged_at ON public.compliance_acknowledgments_archive(acknowledged_at);

-- =====================================================
-- 2. Create Archive Function
-- =====================================================
CREATE OR REPLACE FUNCTION archive_compliance_acknowledgment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_name TEXT;
  reason TEXT;
BEGIN
  -- Try to get organization name before it might be deleted
  SELECT name INTO org_name
  FROM public.organizations
  WHERE id = OLD.organization_id;

  -- Determine archive reason based on what triggered the delete
  -- (We check if the related records still exist)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = OLD.user_id) THEN
    reason := 'user_deleted';
  ELSIF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = OLD.organization_id) THEN
    reason := 'org_deleted';
  ELSE
    reason := 'manual';
  END IF;

  -- Insert into archive (ignore if already archived)
  INSERT INTO public.compliance_acknowledgments_archive (
    original_id,
    organization_id,
    organization_name,
    user_id,
    user_name,
    user_email,
    ip_address,
    user_agent,
    acknowledged_at,
    policy_version,
    agreement_version,
    full_agreement_text,
    archive_reason
  ) VALUES (
    OLD.id,
    OLD.organization_id,
    COALESCE(org_name, 'Unknown Organization'),
    OLD.user_id,
    OLD.user_name,
    OLD.user_email,
    OLD.ip_address,
    OLD.user_agent,
    OLD.acknowledged_at,
    OLD.policy_version,
    OLD.agreement_version,
    OLD.full_agreement_text,
    reason
  )
  ON CONFLICT (original_id) DO NOTHING;  -- Don't fail if already archived

  -- Allow the delete to proceed
  RETURN OLD;
END;
$$;

-- =====================================================
-- 3. Create Trigger
-- =====================================================
-- This trigger fires BEFORE any delete on compliance_acknowledgments
-- It archives the record first, then allows the delete to proceed

DROP TRIGGER IF EXISTS archive_before_delete ON public.compliance_acknowledgments;

CREATE TRIGGER archive_before_delete
  BEFORE DELETE ON public.compliance_acknowledgments
  FOR EACH ROW
  EXECUTE FUNCTION archive_compliance_acknowledgment();

-- =====================================================
-- 4. Comments for Documentation
-- =====================================================
COMMENT ON TABLE public.compliance_acknowledgments_archive IS
  'PERMANENT LEGAL ARCHIVE - NEVER DELETE. Stores compliance acknowledgments before CASCADE deletion. Used for legal defensibility when users/orgs are removed from the system.';

COMMENT ON COLUMN public.compliance_acknowledgments_archive.archive_reason IS
  'Why record was archived: user_deleted, org_deleted, or manual';

COMMENT ON COLUMN public.compliance_acknowledgments_archive.organization_name IS
  'Organization name captured at archive time (since org may be deleted)';

-- =====================================================
-- 5. RLS Policies for Archive Table
-- =====================================================
ALTER TABLE public.compliance_acknowledgments_archive ENABLE ROW LEVEL SECURITY;

-- Only allow SELECT (read-only archive)
-- Inserts happen via trigger (SECURITY DEFINER)
-- No updates or deletes allowed via RLS

CREATE POLICY "Admins can view archived acknowledgments"
  ON public.compliance_acknowledgments_archive
  FOR SELECT
  USING (
    -- Allow users to see archives for orgs they belong to
    -- OR archives where they were the original user
    organization_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- No INSERT/UPDATE/DELETE policies = archive is immutable via API
-- Only the trigger can insert (via SECURITY DEFINER)

-- =====================================================
-- 6. Grant Permissions
-- =====================================================
-- Read-only access for authenticated users (filtered by RLS)
GRANT SELECT ON public.compliance_acknowledgments_archive TO authenticated;
