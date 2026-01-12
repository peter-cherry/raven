-- Migration: Add contractor role support
-- Date: 2025-11-27
-- Purpose: Differentiate between operators (clients) and contractors (technicians)

-- =====================================================
-- 1. UPDATE ORG_MEMBERSHIPS ROLE COMMENT
-- =====================================================

-- Document the contractor role
COMMENT ON COLUMN public.org_memberships.role IS 'User role: owner, admin, member, or contractor';

-- =====================================================
-- 2. CREATE HELPER FUNCTION TO CHECK USER ROLE
-- =====================================================

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.org_memberships
  WHERE user_id = user_uuid
  LIMIT 1;

  RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a contractor
CREATE OR REPLACE FUNCTION public.is_contractor(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_memberships
    WHERE user_id = user_uuid AND role = 'contractor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. UPDATE AUTO-ORG CREATION TRIGGER
-- =====================================================

-- Update trigger to NOT create org for contractors
-- Contractors will be added to orgs when they're hired by operators
CREATE OR REPLACE FUNCTION public.auto_create_user_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
  is_contractor_signup BOOLEAN;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

  -- Skip if user already has org membership
  IF EXISTS (SELECT 1 FROM org_memberships WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Check if this is a contractor signup (email contains +contractor or user_metadata has contractor flag)
  -- This will be set by the contractor signup flow
  is_contractor_signup := (NEW.raw_user_meta_data->>'is_contractor')::BOOLEAN;

  -- If contractor signup, create contractor membership without org
  IF is_contractor_signup THEN
    -- Contractors don't get their own org - they'll be added to client orgs when hired
    -- Create a placeholder org membership with contractor role
    -- They'll be associated with actual orgs later
    INSERT INTO organizations (name)
    VALUES ('Contractor Pool')
    ON CONFLICT DO NOTHING;

    INSERT INTO org_memberships (org_id, user_id, role)
    SELECT id, NEW.id, 'contractor'
    FROM organizations
    WHERE name = 'Contractor Pool'
    LIMIT 1;

    RAISE NOTICE 'Created contractor membership for user %', NEW.id;
    RETURN NEW;
  END IF;

  -- Create organization for operators (clients)
  INSERT INTO organizations (name)
  VALUES (COALESCE(SPLIT_PART(user_email, '@', 1), 'User') || '''s Organization')
  RETURNING id INTO new_org_id;

  -- Create org membership with owner role
  INSERT INTO org_memberships (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RAISE NOTICE 'Auto-created org % for operator user %', new_org_id, NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to auto-create org for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- =====================================================
-- 4. CREATE CONTRACTOR POOL ORG IF NOT EXISTS
-- =====================================================

INSERT INTO public.organizations (name, created_at)
VALUES ('Contractor Pool', now())
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.organizations IS 'Organizations table. "Contractor Pool" is a special org for unassigned contractors.';
