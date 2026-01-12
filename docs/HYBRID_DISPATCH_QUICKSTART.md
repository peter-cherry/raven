# Hybrid Dispatch System - Quick Start

## 🚀 5-Minute Setup Guide

Get the hybrid dispatch system (SendGrid + Instantly) up and running quickly.

---

## Prerequisites

- [ ] Supabase project running
- [ ] Next.js app deployed
- [ ] SendGrid account (free tier OK for testing)
- [ ] Instantly account (or ready to use just SendGrid)

---

## Step 1: Apply Database Migration (2 min)

1. Open Supabase dashboard → SQL Editor
2. Copy contents of [`supabase/migrations/20251024_add_warm_cold_tracking.sql`](../supabase/migrations/20251024_add_warm_cold_tracking.sql)
3. Paste and click **Run**
4. Verify success: ✅ "Success. No rows returned"

---

## Step 2: Configure SendGrid (10 min)

### Quick Setup

1. Go to https://sendgrid.com → Sign up
2. Verify sender identity:
   - Go to **Settings** → **Sender Authentication**
   - Click **Verify a Single Sender**
   - Use `jobs@your-domain.com` or your email
   - Check your email and click verify link

3. Create API Key:
   - Go to **Settings** → **API Keys**
   - Click **Create API Key**
   - Name: "Raven Dispatch"
   - Permissions: **Restricted Access** → Enable **Mail Send**
   - Copy the API key (starts with `SG.`)

4. Create email template:
   - Go to **Email API** → **Dynamic Templates**
   - Click **Create a Dynamic Template**
   - Name: "Work Order Notification"
   - Click **Add Version** → **Blank Template** → **Code Editor**
   - Paste HTML from [SENDGRID_TEMPLATE_SETUP.md](./SENDGRID_TEMPLATE_SETUP.md)
   - Save and copy Template ID (starts with `d-`)

### Add to .env.local

```bash
SENDGRID_API_KEY=SG.your-key-here
SENDGRID_TEMPLATE_ID_WORK_ORDER=d-your-template-id-here
SENDGRID_FROM_EMAIL=jobs@your-domain.com
SENDGRID_FROM_NAME=Your Company Jobs
```

---

## Step 3: Configure Instantly (Optional, 5 min)

**Skip this if you only want warm dispatch (SendGrid only)**

1. Go to https://instantly.ai → Sign up
2. Get API key:
   - Go to **Settings** → **API**
   - Copy API key
3. Create campaign:
   - Click **Campaigns** → **New Campaign**
   - Name: "HVAC Jobs"
   - Add email template
   - Set to "Active"
   - Copy Campaign ID from URL (`camp_xxx`)

### Add to .env.local

```bash
INSTANTLY_API_KEY=your-instantly-key
INSTANTLY_CAMPAIGN_ID_HVAC=camp_xxx
# Repeat for other trades or use same campaign
INSTANTLY_CAMPAIGN_ID_PLUMBING=camp_xxx
INSTANTLY_CAMPAIGN_ID_ELECTRICAL=camp_xxx
INSTANTLY_CAMPAIGN_ID_HANDYMAN=camp_xxx
```

---

## Step 4: Deploy Edge Functions (3 min)

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Set secrets (environment variables)
supabase secrets set SENDGRID_API_KEY=SG.xxx
supabase secrets set SENDGRID_TEMPLATE_ID_WORK_ORDER=d-xxx
supabase secrets set SENDGRID_FROM_EMAIL=jobs@yourcompany.com
supabase secrets set SENDGRID_FROM_NAME="Your Company"

# Optional: Instantly secrets
supabase secrets set INSTANTLY_API_KEY=xxx
supabase secrets set INSTANTLY_CAMPAIGN_ID_HVAC=camp_xxx

# Deploy functions
supabase functions deploy dispatch-work-order
supabase functions deploy track-email-open
```

---

## Step 5: Test (5 min)

### Create Test Technician

```sql
-- In Supabase SQL Editor
INSERT INTO technicians (
  full_name, email, trade, status, signed_up, business_name
) VALUES (
  'Test Warm Tech',
  'your-email@gmail.com',  -- Use YOUR email for testing
  'HVAC',
  'active',
  true,  -- This makes it a "warm" tech (SendGrid)
  'Test HVAC Co'
);
```

### Create Test Job

1. Go to your app's job creation page
2. Create a new HVAC job
3. Note the job ID

### Trigger Dispatch

Option A - Via UI:
1. Go to job details page
2. Click "Dispatch to All Technicians" button
3. Watch DispatchLoader component update

Option B - Via SQL:
```sql
-- Get the job_id from your test job, then:
SELECT * FROM dispatch_work_order(json_build_object('job_id', 'YOUR_JOB_ID_HERE'));
```

### Verify

- [ ] Check your email inbox
- [ ] Should receive email from "Your Company Jobs"
- [ ] Email should have job details
- [ ] "Accept This Job" button should work
- [ ] UI should show "🔥 1 warm tech reached"

---

## Step 6: Mark Test Tech as Cold (Optional)

To test cold dispatch with Instantly:

```sql
UPDATE technicians
SET signed_up = false
WHERE email = 'your-email@gmail.com';
```

Now dispatch again - the tech should be added to your Instantly campaign instead of receiving immediate SendGrid email.

---

## Troubleshooting

### "SendGrid API key not found"

- Check `.env.local` has `SENDGRID_API_KEY`
- Restart Next.js dev server
- For Edge Functions, use `supabase secrets set` instead

### "Template not found"

- Verify Template ID is correct (starts with `d-`)
- Check template is "Active" in SendGrid dashboard
- Template ID goes in `SENDGRID_TEMPLATE_ID_WORK_ORDER`

### No email received

- Check spam folder
- Verify sender email in SendGrid settings
- Check Edge Function logs: Supabase → Edge Functions → Logs
- Look for errors starting with "❌"

### Email has no data

- Check template variables match ([SENDGRID_TEMPLATE_SETUP.md](./SENDGRID_TEMPLATE_SETUP.md))
- Variables must use `{{variable}}` syntax (double curly braces)
- Test template in SendGrid dashboard first

---

## Next Steps

### Production Deployment

1. **Verify Domain** (Important!):
   - Follow full domain verification in [SENDGRID_TEMPLATE_SETUP.md](./SENDGRID_TEMPLATE_SETUP.md)
   - Add SPF, DKIM, DMARC records
   - Wait for DNS propagation

2. **Warm Up Instantly**:
   - If using cold outreach, warm up your sending email for 14-21 days
   - Start with small daily volume and increase gradually
   - Use Instantly's built-in warmup feature

3. **Set Production URLs**:
```bash
APP_URL=https://your-production-domain.com
```

4. **Monitor**:
   - SendGrid: https://app.sendgrid.com/statistics
   - Instantly: https://app.instantly.ai/dashboard
   - Supabase: Functions → Logs

### Full Documentation

- 📘 [Implementation Summary](./HYBRID_DISPATCH_IMPLEMENTATION_SUMMARY.md)
- 📧 [SendGrid Template Setup](./SENDGRID_TEMPLATE_SETUP.md)
- ⚙️ [Environment Variables](./ENVIRONMENT_VARIABLES.md)
- 🧪 [Testing Guide](./HYBRID_DISPATCH_TESTING.md)

---

## Quick Reference

### Database Tables

| Table | Purpose |
|-------|---------|
| `technicians` | Stores tech info, includes `signed_up` flag |
| `work_order_outreach` | Tracks dispatch campaigns, warm/cold stats |
| `work_order_recipients` | Individual tech recipients, tracks `dispatch_method` |

### Dispatch Methods

| Method | Used For | Sent Via |
|--------|----------|----------|
| `sendgrid_warm` | Subscribed techs | SendGrid (immediate) |
| `instantly_cold` | First-time contact | Instantly (scheduled) |

### Key Functions

| Function | Purpose |
|----------|---------|
| `dispatch-work-order` | Main dispatch logic, routes warm/cold |
| `track-email-open` | Tracking pixel, records opens |
| `update_outreach_stats()` | SQL function, updates counters |
| `increment_warm_opened()` | SQL function, warm open counter |
| `increment_cold_opened()` | SQL function, cold open counter |

---

## Support

**Questions?** Check the full docs:
- [Implementation Summary](./HYBRID_DISPATCH_IMPLEMENTATION_SUMMARY.md)
- [Testing Guide](./HYBRID_DISPATCH_TESTING.md)

**Still stuck?**
- Check Supabase Edge Function logs
- Review [Troubleshooting section](#troubleshooting)
- Test with SendGrid's built-in email testing tool

---

**Status**: ✅ Ready to use!

**Minimum viable setup**: Steps 1-2 + 4-5 (SendGrid only, skip Instantly for now)

**Full setup**: All steps (includes cold outreach via Instantly)
