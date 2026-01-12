> Archived on 2026-01-12 from QUICK_FINISH_SETUP.md. Reason: Review needed - may still be relevant

# 🚀 Quick Finish Setup - Raven Search

**Time Required**: 10-15 minutes
**Status**: Final steps to go live!

---

## Step 1: Run Database Migration (2 minutes)

### Option A: Via Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Copy and paste this SQL:

```sql
-- Add raw_text column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS raw_text TEXT;
COMMENT ON COLUMN jobs.raw_text IS 'Original unstructured text input when creating the job via natural language';

-- Verify it worked
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'jobs' AND column_name = 'raw_text';
```

6. Click "Run" (Ctrl/Cmd + Enter)
7. You should see: `raw_text | text`

### Option B: Via Supabase CLI

```bash
# Make sure you're linked to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push --file supabase/migrations/20251029_add_raw_text_to_jobs.sql
```

---

## Step 2: Add Yourself as Admin (1 minute)

In the same SQL Editor, run:

```sql
-- Add your email as admin (replace with your actual email)
INSERT INTO admin_users (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'peterabdo92@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verify admin access
SELECT * FROM admin_users;
```

**Important**: Replace `'peterabdo92@gmail.com'` with the email you use to sign in!

---

## Step 3: Verify Environment Variables (2 minutes)

Check your `.env.local` file has these (minimum required):

```env
# ✅ Required for basic functionality
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-key

# ⚠️ Required for dispatch to work
SENDGRID_API_KEY=SG.xxx
SENDGRID_TEMPLATE_ID_WORK_ORDER=d-xxx
SENDGRID_FROM_EMAIL=noreply@raven-search.com
SENDGRID_FROM_NAME=Raven Search
OPENAI_API_KEY=sk-xxx

# 🔵 Optional (for cold outreach)
INSTANTLY_API_KEY=xxx
INSTANTLY_CAMPAIGN_ID_HVAC=camp_xxx
```

**Missing SendGrid?** → See Step 4
**Missing OpenAI?** → Get from https://platform.openai.com/api-keys

---

## Step 4: SendGrid Setup (5 minutes if needed)

**Skip if you already have SendGrid configured!**

### Quick SendGrid Setup:

1. **Sign up**: https://sendgrid.com/pricing/ (Free tier: 100 emails/day)

2. **Verify sender email**:
   - Go to Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Use your work email (e.g., peter@raven-search.com)
   - Check inbox and verify

3. **Create API Key**:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: "Raven Search Production"
   - Permissions: "Full Access"
   - Copy key → Add to `.env.local` as `SENDGRID_API_KEY`

4. **Create Email Template**:
   - Go to Email API → Dynamic Templates
   - Click "Create a Dynamic Template"
   - Name: "Work Order Notification"
   - Click on the template → "Add Version"
   - Choose "Blank Template" → Code Editor
   - Paste this minimal HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>New Work Order: {{job_title}}</h2>
  <p><strong>Trade:</strong> {{trade_needed}}</p>
  <p><strong>Location:</strong> {{address_text}}</p>
  <p><strong>Description:</strong> {{description}}</p>

  <h3>Contact Information</h3>
  <p><strong>Name:</strong> {{contact_name}}</p>
  <p><strong>Phone:</strong> {{contact_phone}}</p>
  <p><strong>Email:</strong> {{contact_email}}</p>

  <p style="margin-top: 30px;">
    <a href="{{accept_link}}" style="background: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
      Accept This Job
    </a>
  </p>

  <img src="{{tracking_pixel_url}}" width="1" height="1" />
</body>
</html>
```

   - Click "Save"
   - Copy the Template ID (looks like `d-xxxxxxxxxxxxx`)
   - Add to `.env.local` as `SENDGRID_TEMPLATE_ID_WORK_ORDER`

**Full guide**: See `docs/SENDGRID_TEMPLATE_SETUP.md`

---

## Step 5: Deploy Edge Functions (3 minutes)

**Required for dispatch and email tracking!**

```bash
# Set your Supabase secrets
supabase secrets set SENDGRID_API_KEY=SG.your-key-here
supabase secrets set SENDGRID_TEMPLATE_ID_WORK_ORDER=d-your-template-id
supabase secrets set SENDGRID_FROM_EMAIL=noreply@raven-search.com
supabase secrets set SENDGRID_FROM_NAME="Raven Search"
supabase secrets set OPENAI_API_KEY=sk-your-key-here

# Deploy the functions
supabase functions deploy dispatch-work-order
supabase functions deploy track-email-open

# Verify they deployed
supabase functions list
```

**Don't have Supabase CLI?**
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

---

## Step 6: Test It! (5 minutes)

### Start the app:
```bash
npm run dev
```

### Test workflow:

1. **Sign up**: http://localhost:3000/signup
   - Use the email you added as admin in Step 2

2. **Create organization**: Follow the onboarding flow

3. **Test Work Order Creation**:
   - Go to home page
   - Click in the search bar → "Create WO"
   - Paste this test work order:

   ```
   Need emergency HVAC repair at 123 Main St, Miami FL.
   AC unit not cooling. Contact John Doe at 555-1234 or john@example.com.
   Budget $500-800. Need within 24 hours.
   ```

   - Click "Parse & Create"
   - Watch the AI parse it
   - Click "Create Job & Match"
   - See the dispatch animation!

4. **Test Overlays**:
   - Click "Jobs List" button in sidebar
   - Should see overlay card appear over map
   - Click X to close
   - Click "Compliance" icon
   - Should see blur effect + compliance form

5. **Test Admin**:
   - Go to http://localhost:3000/admin/settings
   - Should see admin dashboard (if you ran Step 2!)

---

## ✅ Success Checklist

After completing these steps, you should have:

- [x] `raw_text` column added to jobs table
- [x] Admin access configured for your email
- [x] SendGrid API key and template configured
- [x] OpenAI API key added
- [x] Edge Functions deployed to Supabase
- [x] App running locally on http://localhost:3000
- [x] Work order creation working
- [x] Dispatch animation showing
- [x] Overlays functioning (Jobs, Compliance)
- [x] Admin dashboard accessible

---

## 🚨 Troubleshooting

### "I can't access admin pages"
→ Make sure you ran the SQL in Step 2 with YOUR email address

### "Dispatch doesn't work"
→ Check Edge Functions are deployed: `supabase functions list`
→ Check secrets are set: `supabase secrets list`

### "Email parsing fails"
→ Make sure `OPENAI_API_KEY` is in `.env.local`
→ Restart dev server: `npm run dev`

### "No emails being sent"
→ Check `SENDGRID_API_KEY` is valid
→ Check Edge Function logs: `supabase functions logs dispatch-work-order`

### "Build fails"
→ Already fixed! Build is passing ✅
→ If issues, run: `npm run build`

---

## 🎉 You're Done!

Your platform is ready to go live. Next steps:

1. **Deploy to production**: `vercel` or `netlify deploy`
2. **Set production env vars** in your hosting dashboard
3. **Run migrations** on production Supabase
4. **Configure SendGrid domain** for production (see `docs/SENDGRID_TEMPLATE_SETUP.md`)
5. **Test end-to-end** with real technicians

---

**Need help?**
- Full docs: See `DEPLOYMENT_CHECKLIST.md`
- Dispatch guide: See `docs/HYBRID_DISPATCH_QUICKSTART.md`
- SendGrid setup: See `docs/SENDGRID_TEMPLATE_SETUP.md`

---

**Built with Claude Code** 🤖
Last updated: October 29, 2025

