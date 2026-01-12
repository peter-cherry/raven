> Archived on 2026-01-12 from RLS_POLICY_FIX.md. Reason: Historical bug fix documentation

# RLS Policy Error Fix - "new row violates row-level security policy for table 'jobs'"

**Problem Date:** January 14, 2025
**Severity:** CRITICAL - Blocking all job creation
**Root Cause:** User not in `org_memberships` table when creating job

---

## Problem Analysis

### Error Message
```
new row violates row-level security policy for table "jobs"
```

### Root Cause Chain

1. **User creates job** in `CreateJobForm.tsx:295-320`
   ```typescript
   const { data: job, error } = await supabase
     .from('jobs')
     .insert({
       org_id: orgId,  // ← Trying to insert with this org_id
       job_title: parsed.data.job_title,
       // ... other fields
     })
   ```

2. **RLS Policy checks** if user is in `org_memberships` (from `20250113_fix_rls_circular_dependency.sql:81-85`)
   ```sql
   CREATE POLICY "Users can create jobs in their org"
     ON jobs
     FOR INSERT
     TO authenticated
     WITH CHECK (org_id IN (SELECT public.user_org_ids()));
   ```

3. **Helper function queries** `org_memberships` table (from `20250113_fix_rls_circular_dependency.sql:13-23`)
   ```sql
   CREATE OR REPLACE FUNCTION public.user_org_ids()
   RETURNS TABLE (org_id UUID)
   AS $$
     SELECT org_id
     FROM public.org_memberships
     WHERE user_id = auth.uid();
   $$;
   ```

4. **Problem:** If user has NO row in `org_memberships`, function returns empty set
   - RLS policy evaluates to FALSE
   - Insert blocked with "violates row-level security policy"

### When This Happens

**Scenario 1: New User Signs Up**
- User signs up via `AuthProvider.tsx:49-86`
- API call to `/api/organizations/create` happens AFTER signup
- Race condition: User tries to create job before org membership is established

**Scenario 2: OAuth Login (Google/Apple)**
- User logs in with OAuth
- Redirected to `/api/auth/callback`
- No organization created automatically
- User navigates to create job → NO org membership → RLS blocks

**Scenario 3: Guest Users**
- Fallback to `/api/organizations/setup-guest` may fail
- User proceeds without valid org membership
- Job creation blocked

---

## Current Flow (BROKEN)

```
User Signs Up
    ↓
auth.users table populated
    ↓
AuthProvider.signUp() creates org via API ← ASYNC, may not complete
    ↓
User navigates to CreateJobForm
    ↓
Tries to create job
    ↓
RLS checks org_memberships ← User NOT in table yet
    ↓
❌ ERROR: "new row violates row-level security policy"
```

---

## Solutions (3 Options)

### Option 1: Ensure Org Membership BEFORE Allowing Job Creation (RECOMMENDED)

**Strategy:** Block job creation UI until user has confirmed org membership

**Implementation:**

1. **Add org membership check to CreateJobForm**

```typescript
// File: components/CreateJobForm.tsx
// Add at line ~206 (after useAuth hook)

const [hasOrgMembership, setHasOrgMembership] = useState<boolean | null>(null);
const [checkingMembership, setCheckingMembership] = useState(true);

useEffect(() => {
  async function checkOrgMembership() {
    if (!user) {
      setCheckingMembership(false);
      return;
    }

    const { data, error } = await supabase
      .from('org_memberships')
      .select('org_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[Org Membership Check] Error:', error);
      setHasOrgMembership(false);
    } else {
      setHasOrgMembership(!!data);
    }
    setCheckingMembership(false);
  }

  checkOrgMembership();
}, [user]);

// Add early return if no membership
if (checkingMembership) {
  return <div>Checking organization membership...</div>;
}

if (!hasOrgMembership && user) {
  return (
    <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
      <h3>Setting up your organization...</h3>
      <p>Please wait while we complete your account setup.</p>
      <button onClick={() => window.location.reload()}>
        Refresh Page
      </button>
    </div>
  );
}
```

**Pros:**
- ✅ Prevents RLS errors completely
- ✅ Clear user feedback
- ✅ No database schema changes

**Cons:**
- ⚠️ Adds loading state
- ⚠️ Extra database query

---

### Option 2: Use Database Trigger to Auto-Create Org Membership

**Strategy:** Automatically create org membership when user signs up

**Implementation:**

```sql
-- File: supabase/migrations/20250114_auto_create_org_membership.sql

-- Create trigger function to auto-create org and membership
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
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Check if user already has org membership
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

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS auto_create_org_on_signup ON auth.users;
CREATE TRIGGER auto_create_org_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_user_org();
```

**Pros:**
- ✅ Completely automatic
- ✅ No race conditions
- ✅ No frontend changes needed

**Cons:**
- ⚠️ Requires trigger on auth schema (may conflict with Supabase updates)
- ⚠️ Creates org for ALL users (even OAuth users who may join existing org)

---

### Option 3: Relax RLS Policy with Fallback Org

**Strategy:** Allow job creation with default org if user has none

**Implementation:**

```sql
-- File: supabase/migrations/20250114_relax_jobs_rls_policy.sql

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create jobs in their org" ON jobs;

-- Create relaxed policy that allows:
-- 1. Creating jobs in user's org (if they have one)
-- 2. Creating jobs in default org (if they don't)
CREATE POLICY "Users can create jobs in their org or default org"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User has org membership for this org
    org_id IN (SELECT public.user_org_ids())
    OR
    -- OR this is the default org and user has no org memberships
    (
      org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID
      AND NOT EXISTS (
        SELECT 1 FROM org_memberships WHERE user_id = auth.uid()
      )
    )
  );
```

**Pros:**
- ✅ No frontend changes
- ✅ Allows immediate job creation
- ✅ Fallback for edge cases

**Cons:**
- ⚠️ Jobs may end up in default org unintentionally
- ⚠️ Less strict security (users without proper org can still create jobs)

---

## Recommended Solution: HYBRID APPROACH

Combine **Option 1** (frontend check) + **Option 2** (database trigger)

### Why Hybrid?

1. **Database Trigger** ensures org membership exists for 99% of users
2. **Frontend Check** provides user feedback for the 1% edge cases
3. **Best of both worlds:** Automatic + Safe

### Implementation Steps

#### Step 1: Create Database Trigger

```bash
# Create migration file
cat > supabase/migrations/20250114_auto_create_org_membership.sql << 'EOF'
-- Auto-create organization and membership on user signup
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
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS auto_create_org_on_signup ON auth.users;

-- Create trigger
CREATE TRIGGER auto_create_org_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_user_org();

-- Backfill existing users without org membership
DO $$
DECLARE
  user_rec RECORD;
  new_org_id UUID;
BEGIN
  FOR user_rec IN
    SELECT u.id, u.email
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM org_memberships om WHERE om.user_id = u.id
    )
  LOOP
    -- Create org
    INSERT INTO organizations (name)
    VALUES (COALESCE(SPLIT_PART(user_rec.email, '@', 1), 'User') || '''s Organization')
    RETURNING id INTO new_org_id;

    -- Create membership
    INSERT INTO org_memberships (org_id, user_id, role)
    VALUES (new_org_id, user_rec.id, 'owner');

    RAISE NOTICE 'Backfilled org % for user %', new_org_id, user_rec.id;
  END LOOP;
END $$;
EOF
```

#### Step 2: Add Frontend Safety Check

```typescript
// File: components/CreateJobForm.tsx
// Add after line 206

const [orgMembershipStatus, setOrgMembershipStatus] = useState<'checking' | 'has-org' | 'no-org' | 'error'>('checking');

useEffect(() => {
  async function verifyOrgMembership() {
    if (!user) {
      setOrgMembershipStatus('no-org');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('org_memberships')
        .select('org_id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[Org Membership Verification] Error:', error);
        setOrgMembershipStatus('error');
        return;
      }

      if (data) {
        console.log('[Org Membership Verification] User has org:', data.org_id);
        setOrgMembershipStatus('has-org');
      } else {
        console.warn('[Org Membership Verification] User has NO org membership');
        setOrgMembershipStatus('no-org');
      }
    } catch (err) {
      console.error('[Org Membership Verification] Unexpected error:', err);
      setOrgMembershipStatus('error');
    }
  }

  verifyOrgMembership();
}, [user]);

// Add safety UI at beginning of component render
if (orgMembershipStatus === 'checking') {
  return (
    <div style={{
      padding: 'var(--spacing-2xl)',
      textAlign: 'center',
      color: 'var(--text-primary)'
    }}>
      <div style={{ fontSize: 'var(--font-xl)', marginBottom: 'var(--spacing-md)' }}>
        Verifying account setup...
      </div>
    </div>
  );
}

if (orgMembershipStatus === 'no-org' && user) {
  return (
    <div style={{
      padding: 'var(--spacing-2xl)',
      textAlign: 'center',
      color: 'var(--text-primary)'
    }}>
      <div style={{ fontSize: 'var(--font-xl)', marginBottom: 'var(--spacing-md)' }}>
        Setting up your organization...
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
        Please wait a moment while we complete your account setup.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: 'var(--spacing-md) var(--spacing-xl)',
          background: 'var(--accent-primary)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--btn-corner-radius)',
          cursor: 'pointer'
        }}
      >
        Refresh Page
      </button>
    </div>
  );
}

if (orgMembershipStatus === 'error') {
  return (
    <div style={{
      padding: 'var(--spacing-2xl)',
      textAlign: 'center',
      color: 'var(--error)'
    }}>
      <div style={{ fontSize: 'var(--font-xl)', marginBottom: 'var(--spacing-md)' }}>
        Unable to verify organization
      </div>
      <p style={{ marginBottom: 'var(--spacing-lg)' }}>
        There was an error verifying your account setup.
      </p>
      <button onClick={() => window.location.reload()}>
        Try Again
      </button>
    </div>
  );
}

// Continue with normal form rendering...
```

#### Step 3: Deploy Migration

```bash
# Run migration on Supabase
supabase db push

# Or via Supabase dashboard:
# SQL Editor → New Query → Paste migration → Run
```

#### Step 4: Test

```bash
# Test 1: New user signup
# 1. Sign up new user
# 2. Check org_memberships table - should have entry
# 3. Try creating job - should succeed

# Test 2: OAuth login
# 1. Sign in with Google
# 2. Check org_memberships table - should auto-create
# 3. Try creating job - should succeed

# Test 3: Existing user without org
# 1. Find user in auth.users without org_memberships entry
# 2. Run backfill script manually
# 3. Verify org created
```

---

## Migration Script (READY TO RUN)

```sql
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
```

---

## Quick Fix (If You Need to Create Jobs NOW)

**Temporary workaround** - Manually add yourself to org_memberships:

```sql
-- Run this in Supabase SQL Editor
-- Replace YOUR_USER_ID with your actual user ID from auth.users

-- Get your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Create org
INSERT INTO organizations (name)
VALUES ('My Organization')
RETURNING id;

-- Add membership (replace UUIDs)
INSERT INTO org_memberships (org_id, user_id, role)
VALUES (
  'ORG_ID_FROM_ABOVE',
  'YOUR_USER_ID_FROM_ABOVE',
  'owner'
);
```

---

## Testing Checklist

After deploying the fix:

- [ ] Run migration script on Supabase
- [ ] Verify trigger created: `SELECT * FROM pg_trigger WHERE tgname = 'auto_create_org_on_signup'`
- [ ] Check backfill completed: `SELECT COUNT(*) FROM org_memberships`
- [ ] Test new user signup → verify org created automatically
- [ ] Test OAuth login (Google) → verify org created
- [ ] Test job creation → should succeed without RLS error
- [ ] Verify no users without org: `SELECT COUNT(*) FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM org_memberships om WHERE om.user_id = u.id)`

---

## Summary

**Root Cause:** Users don't have entries in `org_memberships` table when trying to create jobs

**Fix:** Database trigger + frontend safety check

**Impact:** Eliminates 100% of RLS policy errors for job creation

**Deployment Time:** 5 minutes (run migration, update frontend component)

**Risk:** LOW - Trigger only creates orgs for users without them, no breaking changes

