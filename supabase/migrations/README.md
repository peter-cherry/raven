# Database Migrations - Admin Tables

## Overview

This migration creates three essential tables for the admin Activity and Outreach pages:

1. **`outreach_campaigns`** - Email campaign configurations integrated with Instantly.ai
2. **`outreach_targets`** - Contact leads for email outreach campaigns
3. **`scraping_activity`** - Logs of web scraping jobs for finding contractor contacts

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended for Production)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Open the file: `supabase/migrations/20250114_create_admin_tables.sql`
4. Copy the entire SQL content
5. Paste into the SQL Editor
6. Click **Run** to execute the migration

### Option 2: Supabase CLI (For Development)

If you have the Supabase CLI installed:

```bash
# Navigate to project root
cd /Users/peterabdo/ravensearch/raven-claude

# Apply the migration
supabase db push
```

### Option 3: Direct Database Connection

If you have direct PostgreSQL access:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/20250114_create_admin_tables.sql
```

## What This Migration Creates

### Tables

| Table Name | Purpose | Key Features |
|------------|---------|--------------|
| `outreach_campaigns` | Stores email campaign configs | Real-time sync with Instantly.ai, campaign analytics |
| `outreach_targets` | Stores technician contacts | Email verification, lead scoring, duplicate detection |
| `scraping_activity` | Logs scraping jobs | Performance metrics, status tracking, error logging |

### Triggers

- **`update_outreach_campaigns_updated_at()`** - Auto-updates `updated_at` timestamp
- **`update_outreach_targets_updated_at()`** - Auto-updates `updated_at` timestamp
- **`calculate_scraping_duration()`** - Auto-calculates scraping job duration

### Security (Row Level Security)

All three tables have RLS enabled with policies that:
- Allow admin users (in `admin_users` table) to perform all operations
- Block non-admin users from accessing the data

## Verification

After applying the migration, verify the tables exist:

```sql
-- Check that tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('outreach_campaigns', 'outreach_targets', 'scraping_activity');

-- Check Row Level Security is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('outreach_campaigns', 'outreach_targets', 'scraping_activity');

-- Verify triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

## Integration with Existing Features

### Admin Activity Page (`/app/admin/activity/page.tsx`)

Now displays:
- **Total Targets** - Count from `outreach_targets`
- **Pending Enrichment** - Targets with `enrichment_status = 'pending'`
- **Enriched** - Targets with `enrichment_status = 'enriched'` or `'verified'`
- **Failed** - Targets with `enrichment_status = 'failed'`
- **Recent Scraping Activity** - Last 50 jobs from `scraping_activity`

### Admin Outreach Page (`/app/admin/outreach/page.tsx`)

Now manages:
- **Campaigns Tab** - Create/view campaigns from `outreach_campaigns`
- **Targets Tab** - View collected technician contacts from `outreach_targets`
- **Instantly.ai Integration** - Validate campaign IDs via existing API routes
- **Collector** - Scrape technicians using Google Places API

## Existing API Routes (Already Working)

These routes are already functional and will work with the new tables:

- **POST `/api/instantly/validate-campaign`** - Validates Instantly campaign IDs
- **POST `/api/instantly/dispatch-leads`** - Sends leads to Instantly campaigns
- **POST `/supabase/functions/v1/scrape-with-playwright`** - Scrapes technician data

## Next Steps After Migration

1. **Test the Activity Page** - Navigate to `/admin/activity` and verify stats display
2. **Create Your First Campaign**:
   - Go to `/admin/outreach`
   - Click "New Campaign"
   - Enter your Instantly campaign ID (get from Instantly.ai dashboard)
   - Fill in campaign name and trade filter
   - Click "Create Campaign"
3. **Collect Technicians**:
   - Go to "Targets" tab in Outreach page
   - Click "Collect Technicians"
   - Enter trade, city, and state
   - Click "Start Collection"
4. **Monitor Progress** - Watch Activity page for real-time scraping updates

## Rollback (If Needed)

If you need to undo this migration:

```sql
-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_update_outreach_campaigns_updated_at ON outreach_campaigns;
DROP TRIGGER IF EXISTS trigger_update_outreach_targets_updated_at ON outreach_targets;
DROP TRIGGER IF EXISTS trigger_calculate_scraping_duration ON scraping_activity;

-- Drop trigger functions
DROP FUNCTION IF EXISTS update_outreach_campaigns_updated_at();
DROP FUNCTION IF EXISTS update_outreach_targets_updated_at();
DROP FUNCTION IF EXISTS calculate_scraping_duration();

-- Drop tables (cascade will remove policies)
DROP TABLE IF EXISTS scraping_activity CASCADE;
DROP TABLE IF EXISTS outreach_targets CASCADE;
DROP TABLE IF EXISTS outreach_campaigns CASCADE;
```

## Support

If you encounter issues:

1. Check Supabase logs in dashboard → Logs
2. Verify `admin_users` table exists (required for RLS policies)
3. Ensure your user is in the `admin_users` table
4. Check that `INSTANTLY_API_KEY` is set in environment variables

## Schema Diagram

```
┌─────────────────────────┐
│  outreach_campaigns     │
├─────────────────────────┤
│ id (UUID, PK)          │
│ name (TEXT)            │
│ instantly_campaign_id  │
│ trade_filter (TEXT[])  │
│ emails_sent (INT)      │
│ emails_opened (INT)    │
│ replies_received (INT) │
│ status (TEXT)          │
└─────────────────────────┘
            │
            │ (references campaign IDs)
            ▼
┌─────────────────────────┐
│  outreach_targets       │
├─────────────────────────┤
│ id (UUID, PK)          │
│ email (TEXT, UNIQUE)   │
│ full_name (TEXT)       │
│ trade (TEXT)           │
│ state (TEXT)           │
│ enrichment_status      │
│ lead_score (INT)       │
└─────────────────────────┘
            ▲
            │ (creates targets)
            │
┌─────────────────────────┐
│  scraping_activity      │
├─────────────────────────┤
│ id (UUID, PK)          │
│ source (TEXT)          │
│ trade (TEXT)           │
│ state (TEXT)           │
│ results_found (INT)    │
│ new_targets (INT)      │
│ status (TEXT)          │
└─────────────────────────┘
```
