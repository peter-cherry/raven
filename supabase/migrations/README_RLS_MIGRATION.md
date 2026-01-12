# Row Level Security (RLS) Migration Guide

## 🚨 CRITICAL SECURITY UPDATE

This migration **re-enables Row Level Security (RLS)** that was disabled for testing. Without this migration, your database has **NO ACCESS CONTROLS** and any authenticated user can see data from ANY organization.

## What This Migration Does

### Tables Secured:
1. **technicians** - Multi-tenant isolation by org_id
2. **jobs** - Multi-tenant isolation by org_id
3. **raw_work_orders** - Multi-tenant isolation by org_id
4. **org_memberships** - Users can only see/manage memberships in their orgs
5. **job_dispatches** - Accessible only if user has access to the parent job

### Security Policies Created:

#### For Each Table (technicians, jobs, raw_work_orders):
- ✅ **SELECT**: Users can view records from their organization(s)
- ✅ **INSERT**: Users can create records in their organization(s)
- ✅ **UPDATE**: Users can update records in their organization(s)
- ✅ **DELETE**: Only org owners can delete records

#### For org_memberships:
- ✅ **SELECT**: Users can view their own memberships + all memberships in their orgs
- ✅ **INSERT**: Org owners can invite users to their org
- ✅ **UPDATE**: Org owners can change user roles
- ✅ **DELETE**: Org owners can remove users

## How to Apply This Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy the contents of `20250113_enable_rls_all_tables.sql`
5. Paste into the SQL editor
6. Click **Run**
7. Check the output for the RLS STATUS SUMMARY

### Option 2: Using Supabase CLI

```bash
# From project root
supabase db push
```

This will apply all pending migrations including the RLS migration.

### Option 3: Using Direct SQL Connection

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration
\i supabase/migrations/20250113_enable_rls_all_tables.sql
```

## Verification

After applying the migration, you should see output like:

```
==============================================
RLS STATUS SUMMARY
==============================================
technicians               - RLS: ENABLED ✓
jobs                      - RLS: ENABLED ✓
raw_work_orders           - RLS: ENABLED ✓
org_memberships           - RLS: ENABLED ✓
organizations             - RLS: ENABLED ✓
job_dispatches            - RLS: ENABLED ✓
==============================================
```

### Manual Verification

Run this query in SQL Editor to check RLS status:

```sql
SELECT
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED ✓' ELSE 'DISABLED ✗' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('technicians', 'jobs', 'raw_work_orders', 'org_memberships', 'organizations', 'job_dispatches')
ORDER BY tablename;
```

## Testing RLS

### Test 1: Verify Data Isolation

1. Create two test users in different organizations
2. Log in as User A and create a job/technician
3. Log in as User B
4. Try to query User A's data:
   ```sql
   SELECT * FROM jobs WHERE org_id = '[user-a-org-id]';
   ```
5. **Expected Result**: Should return 0 rows (User B cannot see User A's data)

### Test 2: Verify Same-Org Access

1. Log in as User A
2. Create a job/technician
3. Query your own data:
   ```sql
   SELECT * FROM jobs;
   ```
4. **Expected Result**: Should return User A's jobs

### Test 3: Application-Level Testing

1. Log in to the application with a test account
2. Navigate to `/technicians`
3. **Expected Result**: Should only see technicians from your organization
4. Log in with a different test account in a different org
5. **Expected Result**: Should see different technicians (from the new org)

## Impact on Application Code

### ✅ Good News: No Breaking Changes

The application code already filters by `org_id`:
- `app/technicians/page.tsx` - `.eq('org_id', userOrgId)`
- `components/JobsOverlay.tsx` - `.eq('org_id', userOrgId)`

RLS adds an **additional layer of security** at the database level, so even if application code forgets to filter, the database will enforce it.

### 🎯 Future Optimization (Optional)

Once RLS is working, you can **simplify application queries** by removing `.eq('org_id', userOrgId)` since the database will automatically filter by org:

**Before (with RLS):**
```typescript
const { data } = await supabase
  .from('technicians')
  .select('*')
  .eq('org_id', userOrgId); // Redundant with RLS
```

**After (RLS handles filtering):**
```typescript
const { data } = await supabase
  .from('technicians')
  .select('*'); // RLS automatically filters by user's org
```

However, keeping the explicit filter is fine and adds clarity.

## Troubleshooting

### Issue: No data returned after enabling RLS

**Cause**: User not associated with any organization

**Solution**: Ensure users have an entry in `org_memberships`:
```sql
SELECT * FROM org_memberships WHERE user_id = auth.uid();
```

If no rows, add the user to an organization:
```sql
INSERT INTO org_memberships (user_id, org_id, role)
VALUES ('[user-id]', '[org-id]', 'member');
```

### Issue: "permission denied for table X"

**Cause**: User trying to access table without proper RLS policy

**Solution**: Verify the RLS policies exist:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'technicians'
ORDER BY policyname;
```

### Issue: RLS policies not working in Supabase Studio

**Cause**: Supabase Studio bypasses RLS by default

**Solution**: Toggle "RLS" button in the table editor to test with RLS enabled

## Rollback (Emergency Only)

If you need to rollback and disable RLS (NOT RECOMMENDED for production):

```sql
ALTER TABLE technicians DISABLE ROW LEVEL SECURITY;
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE raw_work_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships DISABLE ROW LEVEL SECURITY;
```

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-tenant Best Practices](https://supabase.com/docs/guides/auth/row-level-security#multi-tenant-applications)

## Migration File

📄 **File**: `supabase/migrations/20250113_enable_rls_all_tables.sql`
📅 **Date**: 2025-01-13
🔐 **Security Level**: CRITICAL
