-- Backfill organization memberships for ALL users without them
-- This ensures every user can create jobs

DO $$
DECLARE
  user_rec RECORD;
  new_org_id UUID;
  backfilled_count INT := 0;
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'BACKFILLING ALL USERS WITHOUT ORG MEMBERSHIPS';
  RAISE NOTICE '==============================================';

  FOR user_rec IN
    SELECT u.id, u.email
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM org_memberships om WHERE om.user_id = u.id
    )
  LOOP
    BEGIN
      -- Create organization
      INSERT INTO organizations (name)
      VALUES (COALESCE(SPLIT_PART(user_rec.email, '@', 1), 'User') || '''s Organization')
      RETURNING id INTO new_org_id;

      -- Create org membership
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

-- Verify all users now have org memberships
DO $$
DECLARE
  total_users INT;
  users_with_org INT;
  users_without_org INT;
  user_rec RECORD;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth.users;

  SELECT COUNT(DISTINCT om.user_id) INTO users_with_org
  FROM org_memberships om
  INNER JOIN auth.users u ON u.id = om.user_id;

  users_without_org := total_users - users_with_org;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'VERIFICATION RESULTS';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total users:           %', total_users;
  RAISE NOTICE 'Users with org:        % (%.0f%%)', users_with_org, (users_with_org::FLOAT / NULLIF(total_users, 0) * 100);
  RAISE NOTICE 'Users without org:     % (%.0f%%)', users_without_org, (users_without_org::FLOAT / NULLIF(total_users, 0) * 100);

  IF users_without_org > 0 THEN
    RAISE WARNING '⚠️  % users still missing org membership!', users_without_org;

    -- List users without orgs
    RAISE NOTICE 'Users without org memberships:';
    FOR user_rec IN
      SELECT u.id, u.email FROM auth.users u
      WHERE NOT EXISTS (SELECT 1 FROM org_memberships om WHERE om.user_id = u.id)
    LOOP
      RAISE NOTICE '  - % (%)', user_rec.email, user_rec.id;
    END LOOP;
  ELSE
    RAISE NOTICE '✅ All users have org memberships!';
  END IF;

  RAISE NOTICE '==============================================';
END $$;
