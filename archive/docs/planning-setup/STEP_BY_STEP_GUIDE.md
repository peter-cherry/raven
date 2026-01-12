> Archived on 2026-01-12 from STEP_BY_STEP_GUIDE.md. Reason: Historical setup guide

# Step-by-Step Setup Guide

Follow these steps **in order** to get your new systems running.

---

## Step 1: Set Up Environment Variables

### What to do:
1. Open your terminal
2. Navigate to the project directory:
   ```bash
   cd /Users/peterabdo/ravensearch/raven-claude
   ```

3. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

4. Open `.env.local` in your code editor:
   ```bash
   code .env.local
   ```
   (or use your preferred editor)

5. Fill in these **required** values:

   **From your Supabase dashboard** (https://app.supabase.com):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - Go to Project Settings → API
   - Copy "Project URL" → paste as `NEXT_PUBLIC_SUPABASE_URL`
   - Copy "anon public" key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy "service_role secret" key → paste as `SUPABASE_SERVICE_ROLE_KEY`

   **For Dispatch System** (already have the API key):
   ```bash
   INSTANTLY_API_KEY=OTNmOWNjNzAtNzBkNC00MWY4LTk0ZWMtNGQxODlhYjc3YmNmOm5sSXdUTmNySWZ2Tg==
   ```
   This is already set correctly!

   **Get your Instantly Campaign IDs** (https://app.instantly.ai):
   - Go to Campaigns
   - Click on each campaign
   - Copy the campaign ID from the URL (looks like `cam_abc123xyz`)
   - Add them to `.env.local`:
   ```bash
   INSTANTLY_CAMPAIGN_ID_HVAC=cam_your_hvac_campaign_id
   INSTANTLY_CAMPAIGN_ID_PLUMBING=cam_your_plumbing_campaign_id
   INSTANTLY_CAMPAIGN_ID_ELECTRICAL=cam_your_electrical_campaign_id
   ```

   **For AI Qualification Bot**:
   - Get OpenAI API key from https://platform.openai.com/api-keys
   ```bash
   OPENAI_API_KEY=sk-proj-...
   ```

   **For Admin Outreach (optional but recommended)**:
   - Get Hunter.io API key from https://hunter.io/api-keys
   ```bash
   HUNTER_API_KEY=your_hunter_api_key
   ```

6. Save the file

### ✅ How to verify:
```bash
cat .env.local | grep SUPABASE_URL
```
Should show your Supabase URL (not "your_supabase_url")

---

## Step 2: Run Database Migrations

### What to do:

1. Go to your Supabase project dashboard: https://app.supabase.com

2. Click on "SQL Editor" in the left sidebar

3. Click "New query"

4. **Migration 1: Admin System**
   - Open `supabase/migrations/20251023_admin_system.sql` from your project
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" button
   - Wait for "Success" message

5. **Migration 2: SLA Timers**
   - Open `supabase/migrations/20251023_sla_timers.sql`
   - Copy the entire contents
   - Paste into a new SQL Editor query
   - Click "Run"
   - Wait for "Success"

6. **Migration 3: Dispatch System**
   - Open `supabase/migrations/20251023_dispatch_system.sql`
   - Copy, paste, run
   - Wait for "Success"

7. **Migration 4: Admin Outreach**
   - Open `supabase/migrations/20251023_admin_outreach.sql`
   - Copy, paste, run
   - Wait for "Success"

### ✅ How to verify:
In Supabase SQL Editor, run:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('sla_timers', 'work_order_outreach', 'admin_users', 'outreach_campaigns');
```

Should return 4 rows showing these tables exist.

---

## Step 3: Make Yourself an Admin

### What to do:

1. Make sure you have an account in your app:
   - Go to http://localhost:3000/signup (or start dev server first - see Step 5)
   - Sign up with your email if you haven't already
   - OR use your existing account email

2. In Supabase SQL Editor, run this query:
   ```sql
   INSERT INTO admin_users (user_id, email)
   SELECT id, email FROM auth.users WHERE email = 'your@email.com';
   ```

   **Replace** `your@email.com` with your actual email!

3. Click "Run"

### ✅ How to verify:
```sql
SELECT * FROM admin_users;
```
Should show your email in the results.

---

## Step 4: Deploy Edge Functions

### What to do:

1. Make sure you have Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```
   - It will open a browser
   - Login with your Supabase account
   - Go back to terminal

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

   To find your project ref:
   - Go to https://app.supabase.com
   - Your URL looks like: `https://app.supabase.com/project/abc123xyz`
   - The `abc123xyz` part is your project ref

4. Deploy each Edge Function:
   ```bash
   supabase functions deploy sla-timer-engine
   supabase functions deploy dispatch-work-order
   supabase functions deploy track-email-open
   supabase functions deploy collect-technicians
   supabase functions deploy enrich-emails
   supabase functions deploy send-to-instantly
   supabase functions deploy handle-technician-reply
   supabase functions deploy ai-qualification-bot
   ```

   **Important**: Set environment variables for each function that needs them:

   For `dispatch-work-order`:
   ```bash
   supabase secrets set INSTANTLY_API_KEY=OTNmOWNjNzAtNzBkNC00MWY4LTk0ZWMtNGQxODlhYjc3YmNmOm5sSXdUTmNySWZ2Tg==
   supabase secrets set INSTANTLY_CAMPAIGN_ID_HVAC=cam_your_hvac_id
   supabase secrets set INSTANTLY_CAMPAIGN_ID_PLUMBING=cam_your_plumbing_id
   supabase secrets set INSTANTLY_CAMPAIGN_ID_ELECTRICAL=cam_your_electrical_id
   ```

   For `ai-qualification-bot`:
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-proj-your-key
   ```

   For `enrich-emails`:
   ```bash
   supabase secrets set HUNTER_API_KEY=your_hunter_key
   ```

5. Set up cron job for SLA timer checking:
   - Go to Supabase Dashboard → Database → Cron Jobs (if available)
   - OR use Supabase CLI:
   ```bash
   supabase functions schedule sla-timer-engine --cron "* * * * *"
   ```
   This runs it every minute.

### ✅ How to verify:
```bash
supabase functions list
```
Should show all 8 functions with status "deployed"

---

## Step 5: Test the Build

### What to do:

1. Install dependencies (if not already done):
   ```bash
   cd /Users/peterabdo/ravensearch/raven-claude
   npm install
   ```

2. Try building:
   ```bash
   npm run build
   ```

   **Expected result**: Build should complete successfully now that env vars are set.

3. If build succeeds, start the development server:
   ```bash
   npm run dev
   ```

4. Open browser to: http://localhost:3000

### ✅ How to verify:
- No errors in build output
- Dev server starts without errors
- Homepage loads in browser

---

## Step 6: Test SLA System

### What to do:

1. Go to http://localhost:3000/jobs/create

2. Fill out the job form:
   - Select a trade (e.g., "HVAC")
   - Select urgency (e.g., "Emergency")
   - Fill in address and description

3. **Look for the SLA Settings section** - should appear after you select trade and urgency

4. You should see 4 timer inputs:
   - Dispatch Timer
   - Assignment Timer
   - Arrival Timer
   - Completion Timer

5. The values should be auto-filled based on trade + urgency (you can change them)

6. Click "Create Job"

7. Go to http://localhost:3000/jobs

8. **Look for the SLA badge** next to your new job - should show:
   - 🟢 On Time (with time remaining)
   - Or ⚠️ Warning if getting close
   - Or 🔴 Breached if time exceeded

9. **Click the SLA badge** - a modal should open showing:
   - All 4 timer stages
   - Progress bars
   - Time remaining/elapsed for each
   - Any alerts

### ✅ How to verify:
- SLA settings appear in job creation form
- Job is created successfully
- SLA badge appears on jobs list
- Modal opens when clicking badge
- Timer counts down in real-time (refresh to see updates)

---

## Step 7: Test Dispatch System

### What to do:

1. Go to http://localhost:3000 (homepage)

2. In the search box, enter a job description:
   ```
   Need HVAC repair in Los Angeles, CA. Urgency: emergency
   ```

3. Click "Search" or submit

4. Wait for technician results to load

5. **Look for the "Dispatch to All" button** above the technician cards

6. Click "Dispatch to All X Technicians"

7. You should see a **real-time loader** appear with:
   - Total technicians being reached
   - Emails sent count
   - Emails opened count (updates when someone opens)
   - Replies received
   - Qualified count

8. **Click on a technician's name** in the cards

9. Profile modal opens with **two tabs**:
   - 👤 Profile
   - 💬 AI Conversation

10. Click "AI Conversation" tab

11. You should see:
    - "No conversation yet" message (if tech hasn't replied)
    - Or conversation messages if they have

### ✅ How to verify:
- Dispatch button appears
- Loader shows real-time stats
- Emails are sent via Instantly.ai (check your Instantly dashboard)
- Profile modal has conversation tab
- Stats update in real-time as emails are opened

---

## Step 8: Test Admin Outreach

### What to do:

1. Go to http://localhost:3000/admin/outreach

2. You should see the admin page (if you're not admin, you'll see "Access Denied")

3. Click "New Campaign"

4. Fill in the form:
   - Campaign Name: "Q1 2025 HVAC Outreach"
   - Instantly Campaign ID: `cam_your_actual_campaign_id`
   - Trade Filter: "HVAC"

5. Click "Create Campaign"

6. Go to "Targets" tab

7. Click "Collect Technicians"

8. Fill in the form:
   - Source: "Google Places"
   - Trade: "HVAC"
   - State: "CA"
   - Query: "hvac repair los angeles"

9. Click "Start Collection"

10. You should see success message: "Successfully collected X new technicians!"

11. Go to http://localhost:3000/admin/activity

12. You should see the scraping activity in the table

### ✅ How to verify:
- Admin pages load without "Access Denied"
- Campaign is created
- Collection runs successfully
- Activity log shows the scraping job
- Targets appear in the targets table

---

## Step 9: Set Up Instantly.ai Webhook (Optional)

This allows technicians' email replies to trigger the AI qualification bot.

### What to do:

1. Go to https://app.instantly.ai

2. Go to Settings → Webhooks

3. Add a new webhook:
   - URL: `https://your-project.supabase.co/functions/v1/handle-technician-reply`
   - Get your URL from Supabase Dashboard → Project Settings → API → URL
   - Event: "Reply Received"

4. Save the webhook

### ✅ How to verify:
- When a technician replies to a dispatch email
- The reply should appear in the AI Conversation tab
- AI bot should analyze it and mark as qualified/disqualified

---

## Step 10: Test Everything Together

### End-to-End Test Flow:

1. **Create a job** with SLA settings
   - Go to /jobs/create
   - Fill form with custom SLA timers
   - Submit

2. **Dispatch the job**
   - Go to homepage
   - Search for technicians
   - Click "Dispatch to All"
   - Watch real-time loader

3. **Monitor SLA timers**
   - Go to /jobs
   - Click SLA badge on your job
   - Watch timers count down

4. **Check conversations**
   - Click technician name
   - Switch to AI Conversation tab
   - See messages (if any replies)

5. **Admin monitoring**
   - Go to /admin/activity
   - See all dispatch activity
   - Real-time stats update

### ✅ How to verify:
- All systems work together
- Real-time updates everywhere
- No errors in browser console
- No errors in terminal

---

## Troubleshooting

### Build fails with "Invalid supabaseUrl"
**Solution**: Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL`

### "Access Denied" on admin pages
**Solution**: Run the INSERT query in Step 3 with your email

### Dispatch button doesn't appear
**Solution**: Make sure you have search results showing technicians

### SLA timers not updating
**Solution**:
- Check `sla-timer-engine` Edge Function is deployed
- Check cron job is set up
- Refresh the page to see updates

### Edge Function deployment fails
**Solution**:
```bash
supabase login
supabase link --project-ref your-ref
```
Then try deploying again

### Instantly emails not sending
**Solution**:
- Check `INSTANTLY_API_KEY` in `.env.local`
- Check campaign IDs are correct
- Verify secrets are set: `supabase secrets list`

---

## Support

If you get stuck on any step:

1. Check browser console for errors (F12 → Console)
2. Check terminal for errors
3. Check Supabase logs: Dashboard → Logs → Edge Functions
4. Check database: SQL Editor → run queries to inspect data

---

## Quick Reference

**Start dev server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Deploy an Edge Function:**
```bash
supabase functions deploy function-name
```

**Check Edge Function logs:**
```bash
supabase functions logs function-name
```

**Run SQL query:**
Go to Supabase Dashboard → SQL Editor

**Check environment variables:**
```bash
cat .env.local
```

---

## Next Features to Implement

After everything is working, you might want to:

1. Replace mock data in `collect-technicians` with real Google Places API
2. Add more sophisticated AI qualification prompts
3. Set up email templates in Instantly.ai
4. Add SMS notifications via Twilio
5. Create dashboard widgets for SLA metrics
6. Add export functionality for reports

---

Good luck! 🚀

