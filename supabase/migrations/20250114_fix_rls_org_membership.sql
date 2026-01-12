-- File: supabase/migrations/20250114_fix_rls_org_membership.sql
-- Purpose: Ensure all users have org membership BEFORE creating jobs
-- Fixes: "new row violates row-level security policy for table 'jobs'"

-- =====================================================
-- 1. CREATE AUTO-ORG TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_create_user_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

  -- Skip if user already has org membership
  IF EXISTS (SELECT 1 FROM org_memberships WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Create organization
  INSERT INTO organizations (name)
  VALUES (COALESCE(SPLIT_PART(user_email, '@', 1), 'User') || '''s Organization')
  RETURNING id INTO new_org_id;

  -- Create org membership
  INSERT INTO org_memberships (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RAISE NOTICE 'Auto-created org % for user %', new_org_id, NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to auto-create org for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS auto_create_org_on_signup ON auth.users;

-- Create trigger
CREATE TRIGGER auto_create_org_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_user_org();

-- =====================================================
-- 2. BACKFILL EXISTING USERS
-- =====================================================

DO $$
DECLARE
  user_rec RECORD;
  new_org_id UUID;
  backfilled_count INT := 0;
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'BACKFILLING ORG MEMBERSHIPS FOR EXISTING USERS';
  RAISE NOTICE '==============================================';

  FOR user_rec IN
    SELECT u.id, u.email
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM org_memberships om WHERE om.user_id = u.id
    )
  LOOP
    BEGIN
      -- Create org
      INSERT INTO organizations (name)
      VALUES (COALESCE(SPLIT_PART(user_rec.email, '@', 1), 'User') || '''s Organization')
      RETURNING id INTO new_org_id;

      -- Create membership
      INSERT INTO org_memberships (org_id, user_id, role)
      VALUES (new_org_id, user_rec.id, 'owner');

      backfilled_count := backfilled_count + 1;
      RAISE NOTICE 'Backfilled org % for user % (email: %)', new_org_id, user_rec.id, user_rec.email;

    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to backfill org for user % (email: %): %', user_rec.id, user_rec.email, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'BACKFILL COMPLETE: % users processed', backfilled_count;
  RAISE NOTICE '==============================================';
END $$;

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

DO $$
DECLARE
  total_users INT;
  users_with_org INT;
  users_without_org INT;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth.users;

  SELECT COUNT(DISTINCT om.user_id) INTO users_with_org
  FROM org_memberships om
  INNER JOIN auth.users u ON u.id = om.user_id;

  users_without_org := total_users - users_with_org;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'ORG MEMBERSHIP STATUS';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total users:           %', total_users;
  RAISE NOTICE 'Users with org:        % (%.0f%%)', users_with_org, (users_with_org::FLOAT / NULLIF(total_users, 0) * 100);
  RAISE NOTICE 'Users without org:     % (%.0f%%)', users_without_org, (users_without_org::FLOAT / NULLIF(total_users, 0) * 100);

  IF users_without_org > 0 THEN
    RAISE WARNING '⚠️  % users still missing org membership!', users_without_org;
  ELSE
    RAISE NOTICE '✅ All users have org memberships!';
  END IF;

  RAISE NOTICE '==============================================';
END $$;
