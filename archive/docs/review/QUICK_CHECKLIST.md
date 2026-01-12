> Archived on 2026-01-12 from QUICK_CHECKLIST.md. Reason: Review needed - may still be relevant

# Quick Setup Checklist

Copy this checklist and check off items as you complete them:

## Setup (Do Once)

```
[ ] Step 1: Create .env.local file
    [ ] Copy .env.local.example to .env.local
    [ ] Add NEXT_PUBLIC_SUPABASE_URL
    [ ] Add NEXT_PUBLIC_SUPABASE_ANON_KEY
    [ ] Add SUPABASE_SERVICE_ROLE_KEY
    [ ] Add Instantly campaign IDs (HVAC, Plumbing, Electrical)
    [ ] Add OPENAI_API_KEY
    [ ] Add HUNTER_API_KEY (optional)

[ ] Step 2: Run Database Migrations
    [ ] Run 20251023_admin_system.sql
    [ ] Run 20251023_sla_timers.sql
    [ ] Run 20251023_dispatch_system.sql
    [ ] Run 20251023_admin_outreach.sql
    [ ] Verify tables created

[ ] Step 3: Make Yourself Admin
    [ ] Sign up for account in app
    [ ] Run INSERT INTO admin_users query with your email
    [ ] Verify: SELECT * FROM admin_users shows your email

[ ] Step 4: Deploy Edge Functions
    [ ] Install Supabase CLI: npm install -g supabase
    [ ] Login: supabase login
    [ ] Link project: supabase link --project-ref XXX
    [ ] Deploy sla-timer-engine
    [ ] Deploy dispatch-work-order
    [ ] Deploy track-email-open
    [ ] Deploy collect-technicians
    [ ] Deploy enrich-emails
    [ ] Deploy send-to-instantly
    [ ] Deploy handle-technician-reply
    [ ] Deploy ai-qualification-bot
    [ ] Set secrets for Instantly API key
    [ ] Set secrets for OpenAI API key
    [ ] Set secrets for Hunter API key
    [ ] Set up cron for sla-timer-engine (every minute)

[ ] Step 5: Test Build
    [ ] Run: npm install
    [ ] Run: npm run build (should succeed)
    [ ] Run: npm run dev
    [ ] Open http://localhost:3000 (should load)
```

## Testing (Verify Everything Works)

```
[ ] Step 6: Test SLA System
    [ ] Go to /jobs/create
    [ ] Select trade and urgency
    [ ] See SLA settings section appear
    [ ] See auto-filled timer values
    [ ] Create job
    [ ] Go to /jobs
    [ ] See SLA badge on job card
    [ ] Click badge, modal opens
    [ ] See 4 timer stages with progress bars

[ ] Step 7: Test Dispatch System
    [ ] Go to homepage
    [ ] Enter job description in search
    [ ] See technician results
    [ ] See "Dispatch to All" button
    [ ] Click dispatch button
    [ ] See real-time loader appear
    [ ] Stats update: sent, opened, qualified
    [ ] Click technician name
    [ ] Profile modal opens
    [ ] See two tabs: Profile | AI Conversation
    [ ] Click AI Conversation tab
    [ ] See conversation or "No conversation yet"

[ ] Step 8: Test Admin Outreach
    [ ] Go to /admin/outreach
    [ ] See admin dashboard (not "Access Denied")
    [ ] Click "New Campaign"
    [ ] Create test campaign
    [ ] Switch to "Targets" tab
    [ ] Click "Collect Technicians"
    [ ] Fill form and submit
    [ ] See success message
    [ ] Go to /admin/activity
    [ ] See scraping activity in table

[ ] Step 9: Set Up Webhook (Optional)
    [ ] Go to Instantly.ai settings
    [ ] Add webhook URL
    [ ] Set event to "Reply Received"
    [ ] Save

[ ] Step 10: End-to-End Test
    [ ] Create job with SLA
    [ ] Dispatch job to technicians
    [ ] Monitor SLA timers
    [ ] Check AI conversations
    [ ] View admin activity
```

## Verification Commands

Run these to verify everything is set up:

```bash
# Check environment variables are set
cat .env.local | grep -E "SUPABASE_URL|INSTANTLY_API_KEY|OPENAI_API_KEY"

# Check if dev server starts
npm run dev

# Check Edge Functions are deployed
supabase functions list

# Check secrets are set
supabase secrets list
```

## SQL Verification Queries

Run these in Supabase SQL Editor:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('sla_timers', 'work_order_outreach', 'admin_users', 'outreach_campaigns');

-- Check you're an admin
SELECT * FROM admin_users;

-- Check SLA functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%sla%';
```

## Common Issues & Fixes

**Build fails:**
```bash
# Make sure env vars are set
cat .env.local

# Clear cache and rebuild
rm -rf .next
npm run build
```

**Admin page shows "Access Denied":**
```sql
-- Add yourself as admin
INSERT INTO admin_users (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'your@email.com';
```

**Edge Functions not working:**
```bash
# Check logs
supabase functions logs function-name

# Redeploy
supabase functions deploy function-name
```

**Dispatch not sending emails:**
```bash
# Check secrets are set
supabase secrets list

# Set missing secrets
supabase secrets set INSTANTLY_API_KEY=your-key
```

---

## Done! 🎉

When all checkboxes are marked, you're ready to go!

**Start the app:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
npm start
```

