-- Migration: Compliance Legal Framework
-- Created: 2025-11-19
-- Purpose: Add tables for compliance policies and liability acknowledgments

-- =====================================================
-- 1. Compliance Policies Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.compliance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  version TEXT NOT NULL DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Indexes
  CONSTRAINT compliance_policies_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);

-- Index for faster org lookups
CREATE INDEX IF NOT EXISTS idx_compliance_policies_org_id
  ON public.compliance_policies(org_id);

-- Index for version tracking
CREATE INDEX IF NOT EXISTS idx_compliance_policies_version
  ON public.compliance_policies(version);

-- =====================================================
-- 2. Compliance Acknowledgments Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.compliance_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  policy_version TEXT NOT NULL DEFAULT '1.0',
  agreement_version TEXT NOT NULL DEFAULT '1.0',
  full_agreement_text TEXT NOT NULL,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for org lookups
CREATE INDEX IF NOT EXISTS idx_compliance_ack_org_id
  ON public.compliance_acknowledgments(organization_id);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_compliance_ack_user_id
  ON public.compliance_acknowledgments(user_id);

-- Index for audit/compliance tracking by date
CREATE INDEX IF NOT EXISTS idx_compliance_ack_date
  ON public.compliance_acknowledgments(acknowledged_at);

-- =====================================================
-- 3. Add Compliance Fields to Organizations Table
-- =====================================================
-- Add compliance-related fields to organizations if they don't exist
DO $$
BEGIN
  -- Add compliance_policy_acknowledged column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'organizations'
    AND column_name = 'compliance_policy_acknowledged'
  ) THEN
    ALTER TABLE public.organizations
    ADD COLUMN compliance_policy_acknowledged BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add onboarding_complete column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'organizations'
    AND column_name = 'onboarding_complete'
  ) THEN
    ALTER TABLE public.organizations
    ADD COLUMN onboarding_complete BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add onboarding_completed_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'organizations'
    AND column_name = 'onboarding_completed_at'
  ) THEN
    ALTER TABLE public.organizations
    ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- =====================================================
-- 4. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on compliance_policies
ALTER TABLE public.compliance_policies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view policies for their organization
CREATE POLICY "Users can view their org's compliance policies"
  ON public.compliance_policies
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert policies for their organization
CREATE POLICY "Users can create compliance policies for their org"
  ON public.compliance_policies
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update policies for their organization
CREATE POLICY "Users can update their org's compliance policies"
  ON public.compliance_policies
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Enable RLS on compliance_acknowledgments
ALTER TABLE public.compliance_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view acknowledgments for their organization
CREATE POLICY "Users can view their org's compliance acknowledgments"
  ON public.compliance_acknowledgments
  FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create acknowledgments
CREATE POLICY "Users can create compliance acknowledgments"
  ON public.compliance_acknowledgments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- =====================================================
-- 5. Helper Functions
-- =====================================================

-- Function to get latest compliance policy for an organization
CREATE OR REPLACE FUNCTION get_latest_compliance_policy(org_uuid UUID)
RETURNS TABLE (
  id UUID,
  org_id UUID,
  requirements JSONB,
  version TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.org_id,
    p.requirements,
    p.version,
    p.created_at
  FROM public.compliance_policies p
  WHERE p.org_id = org_uuid
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to check if organization has acknowledged compliance
CREATE OR REPLACE FUNCTION has_acknowledged_compliance(org_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_ack BOOLEAN;
BEGIN
  SELECT compliance_policy_acknowledged INTO has_ack
  FROM public.organizations
  WHERE id = org_uuid;

  RETURN COALESCE(has_ack, FALSE);
END;
$$;

-- =====================================================
-- 6. Comments for Documentation
-- =====================================================

COMMENT ON TABLE public.compliance_policies IS
  'Stores compliance requirement configurations for organizations. Used during onboarding and can be updated over time.';

COMMENT ON TABLE public.compliance_acknowledgments IS
  'Audit trail for compliance responsibility acknowledgments. Captures user acceptance of liability with full context (IP, user agent, timestamp).';

COMMENT ON COLUMN public.compliance_policies.requirements IS
  'JSONB array of requirement objects with id, category, name, description, enforcement level, and metadata';

COMMENT ON COLUMN public.compliance_acknowledgments.full_agreement_text IS
  'Complete text of agreement at time of acknowledgment for legal audit trail';

COMMENT ON COLUMN public.compliance_acknowledgments.ip_address IS
  'IP address from which acknowledgment was made for audit purposes';

COMMENT ON COLUMN public.compliance_acknowledgments.user_agent IS
  'Browser user agent string for audit trail';

-- =====================================================
-- 7. Grant Permissions
-- =====================================================

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.compliance_policies TO authenticated;
GRANT SELECT, INSERT ON public.compliance_acknowledgments TO authenticated;
GRANT USAGE ON SEQUENCE compliance_policies_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE compliance_acknowledgments_id_seq TO authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION get_latest_compliance_policy(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_acknowledged_compliance(UUID) TO authenticated;
