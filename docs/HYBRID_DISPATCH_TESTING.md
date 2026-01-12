# Hybrid Dispatch System - Testing Guide

## Overview

This guide covers testing the hybrid dispatch system (SendGrid warm + Instantly cold).

## Prerequisites

Before testing:

- [ ] Database migration applied (`20251024_add_warm_cold_tracking.sql`)
- [ ] SendGrid configured (API key, template, domain verified)
- [ ] Instantly configured (API key, campaigns created)
- [ ] Environment variables set in `.env.local`
- [ ] Edge Functions deployed
- [ ] Test technicians added to database

## Test Data Setup

### Create Test Technicians

Run this SQL in Supabase SQL Editor:

```sql
-- Insert warm (subscribed) test technician
INSERT INTO technicians (
  id,
  full_name,
  email,
  trade,
  status,
  signed_up,
  consent_date,
  business_name
) VALUES (
  gen_random_uuid(),
  'Warm Test Tech',
  'warm-test@example.com', -- Replace with your test email
  'HVAC',
  'active',
  true, -- Marked as signed up (warm)
  NOW(),
  'Warm HVAC Services'
);

-- Insert cold (first contact) test technician
INSERT INTO technicians (
  id,
  full_name,
  email,
  trade,
  status,
  signed_up, -- Default false (cold)
  business_name
) VALUES (
  gen_random_uuid(),
  'Cold Test Tech',
  'cold-test@example.com', -- Replace with your test email
  'HVAC',
  'active',
  false, -- Not signed up (cold)
  'Cold HVAC Company'
);

-- Verify technicians created
SELECT id, full_name, email, signed_up, trade
FROM technicians
WHERE email LIKE '%test@example.com';
```

### Create Test Work Order

```sql
-- First, get your organization ID
SELECT id, name FROM organizations WHERE name LIKE '%your_email%';

-- Create test work order
INSERT INTO jobs (
  id,
  org_id, -- Use your org ID from above
  job_title,
  description,
  trade_needed,
  priority,
  address_text,
  scheduled_at,
  status
) VALUES (
  'test-job-' || gen_random_uuid(),
  'YOUR_ORG_ID_HERE', -- Replace with your org ID
  'Test HVAC Job - Urgent Repair',
  'Air conditioning unit not cooling. Customer reports warm air from all vents. Need immediate service.',
  'HVAC',
  'High',
  '123 Test St, Miami, FL 33131',
  NOW() + INTERVAL '2 hours',
  'open'
);

-- Get the job ID
SELECT id, job_title, trade_needed
FROM jobs
WHERE job_title LIKE 'Test HVAC%'
ORDER BY created_at DESC
LIMIT 1;
```

## Testing Scenarios

### Test 1: Warm Dispatch (SendGrid)

**Goal**: Verify warm technicians receive emails via SendGrid

**Steps**:

1. Ensure you have a warm technician (`signed_up = true`)
2. Create a work order for their trade
3. Trigger dispatch from the UI or run:

```typescript
// In browser console or test script
const response = await fetch('/api/dispatch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ job_id: 'YOUR_JOB_ID' })
})
const data = await response.json()
console.log(data)
```

**Expected Results**:

- ✅ `warm_sent` counter = 1
- ✅ Email received in inbox (check warm-test@example.com)
- ✅ Email from "Raven Jobs <jobs@raven-search.com>"
- ✅ Subject contains job type
- ✅ "Accept This Job" button works
- ✅ Tracking pixel loads (check browser network tab)
- ✅ UI shows "🔥 1 warm tech reached"

**Verification SQL**:

```sql
SELECT
  wo.id,
  wo.warm_sent,
  wo.cold_sent,
  wor.dispatch_method,
  wor.email_sent,
  wor.email_opened
FROM work_order_outreach wo
JOIN work_order_recipients wor ON wor.outreach_id = wo.id
WHERE wo.job_id = 'YOUR_JOB_ID'
ORDER BY wor.created_at DESC;
```

---

### Test 2: Cold Dispatch (Instantly)

**Goal**: Verify cold technicians receive emails via Instantly

**Steps**:

1. Ensure you have a cold technician (`signed_up = false`)
2. Create a work order for their trade
3. Trigger dispatch

**Expected Results**:

- ✅ `cold_sent` counter = 1
- ✅ Lead added to Instantly campaign (check Instantly dashboard)
- ✅ Email will be sent according to Instantly campaign schedule
- ✅ UI shows "❄️ 1 cold tech reached"
- ✅ `dispatch_method` = 'instantly_cold'

**Verification**:

1. Check Instantly dashboard → Campaigns → Your HVAC Campaign
2. Verify lead appears in campaign
3. Check lead has custom variables set

**Note**: Instantly emails are delayed based on campaign settings, not instant like SendGrid.

---

### Test 3: Mixed Dispatch

**Goal**: Verify both warm and cold techs receive correct emails

**Steps**:

1. Ensure you have BOTH warm and cold technicians for same trade
2. Create work order
3. Trigger dispatch

**Expected Results**:

- ✅ `warm_sent` = 1, `cold_sent` = 1
- ✅ Warm tech gets SendGrid email immediately
- ✅ Cold tech appears in Instantly campaign
- ✅ UI shows split: "🔥 1 warm • ❄️ 1 cold"
- ✅ Both dispatch methods tracked separately

**Verification SQL**:

```sql
SELECT
  wo.warm_sent,
  wo.cold_sent,
  wo.warm_opened,
  wo.cold_opened,
  COUNT(*) FILTER (WHERE wor.dispatch_method = 'sendgrid_warm') as sendgrid_count,
  COUNT(*) FILTER (WHERE wor.dispatch_method = 'instantly_cold') as instantly_count
FROM work_order_outreach wo
JOIN work_order_recipients wor ON wor.outreach_id = wo.id
WHERE wo.job_id = 'YOUR_JOB_ID'
GROUP BY wo.id, wo.warm_sent, wo.cold_sent, wo.warm_opened, wo.cold_opened;
```

---

### Test 4: Email Open Tracking

**Goal**: Verify open tracking works for both warm and cold

**Steps**:

1. Dispatch emails (mixed warm/cold)
2. Open warm tech email in inbox
3. Wait 10 seconds
4. Check database

**Expected Results**:

- ✅ `warm_opened` increments to 1
- ✅ `work_order_recipients.email_opened` = true
- ✅ `work_order_recipients.email_opened_at` set
- ✅ UI updates in real-time
- ✅ Progress bar shows 100% for warm

**Verification SQL**:

```sql
SELECT
  wo.warm_sent,
  wo.warm_opened,
  wo.cold_opened,
  wor.dispatch_method,
  wor.email_opened,
  wor.email_opened_at
FROM work_order_outreach wo
JOIN work_order_recipients wor ON wor.outreach_id = wo.id
WHERE wo.job_id = 'YOUR_JOB_ID';
```

**Instantly Opens**: Cold email opens are tracked by Instantly, not our tracking pixel. Check Instantly dashboard for cold opens.

---

### Test 5: Real-Time UI Updates

**Goal**: Verify DispatchLoader component updates in real-time

**Steps**:

1. Open job page in browser
2. Trigger dispatch
3. Observe DispatchLoader component

**Expected Results**:

- ✅ Initial state shows "Dispatching Work Order..."
- ✅ After 2-5 seconds, shows split stats
- ✅ Warm and cold cards display correct counts
- ✅ Opening warm email updates counter live (no refresh needed)
- ✅ Progress bars animate smoothly
- ✅ Qualified count appears when tech accepts

---

## Testing Checklist

### Database Setup

- [ ] Migration `20251024_add_warm_cold_tracking.sql` applied
- [ ] `technicians.signed_up` column exists
- [ ] `work_order_outreach.warm_sent` column exists
- [ ] Helper functions created (`increment_warm_opened`, etc.)

### SendGrid Configuration

- [ ] API key set in environment variables
- [ ] Template created and ID set
- [ ] Domain verified (jobs@raven-search.com)
- [ ] SPF/DKIM records added to DNS
- [ ] Test email sends successfully
- [ ] Template variables render correctly

### Instantly Configuration

- [ ] API key set in environment variables
- [ ] Campaigns created for each trade
- [ ] Campaign IDs set in environment variables
- [ ] Test lead added manually
- [ ] Campaign is active and sending

### Edge Functions

- [ ] `dispatch-work-order` function deployed
- [ ] `track-email-open` function deployed
- [ ] Functions have access to environment secrets
- [ ] Function logs show no errors

### Frontend Components

- [ ] DispatchLoader component renders
- [ ] Warm/cold split displayed
- [ ] Real-time updates working
- [ ] Progress bars animate
- [ ] Qualified count shows

### End-to-End Tests

- [ ] Test 1: Warm dispatch ✅
- [ ] Test 2: Cold dispatch ✅
- [ ] Test 3: Mixed dispatch ✅
- [ ] Test 4: Email open tracking ✅
- [ ] Test 5: Real-time UI updates ✅

---

## Troubleshooting

### Warm emails not sending

**Check**:
1. SendGrid API key correct?
2. Template ID correct?
3. Domain verified?
4. Technician has `signed_up = true`?
5. Check Edge Function logs for errors

**Debug SQL**:
```sql
SELECT * FROM work_order_recipients
WHERE dispatch_method = 'sendgrid_warm'
AND email_sent = false
ORDER BY created_at DESC;
```

---

### Cold emails not appearing in Instantly

**Check**:
1. Instantly API key correct?
2. Campaign ID for trade correct?
3. Campaign is active?
4. Technician has `signed_up = false`?
5. Check Instantly dashboard for lead

**Debug SQL**:
```sql
SELECT * FROM work_order_recipients
WHERE dispatch_method = 'instantly_cold'
ORDER BY created_at DESC;
```

---

### Counters not updating

**Check**:
1. Run helper functions manually:
```sql
SELECT update_outreach_stats('YOUR_OUTREACH_ID');
```

2. Check if Supabase Realtime is enabled:
```sql
SELECT * FROM pg_publication;
```

3. Verify real-time channel subscription in browser console

---

### Opens not tracking

**Check**:
1. Tracking pixel URL correct in email?
2. `track-email-open` Edge Function deployed?
3. Check function logs for errors
4. Test pixel URL directly in browser

**Test Pixel**:
```
https://your-project.supabase.co/functions/v1/track-email-open?outreach=test&tech=test
```

Should return 1x1 transparent GIF.

---

## Performance Testing

### Load Test: 100 Technicians

```sql
-- Create 50 warm + 50 cold test techs
DO $$
BEGIN
  FOR i IN 1..50 LOOP
    INSERT INTO technicians (full_name, email, trade, signed_up)
    VALUES (
      'Warm Tech ' || i,
      'warm-' || i || '@loadtest.com',
      'HVAC',
      true
    );
  END LOOP;

  FOR i IN 1..50 LOOP
    INSERT INTO technicians (full_name, email, trade, signed_up)
    VALUES (
      'Cold Tech ' || i,
      'cold-' || i || '@loadtest.com',
      'HVAC',
      false
    );
  END LOOP;
END $$;
```

**Expected Performance**:
- Dispatch time: < 30 seconds for 100 techs
- No errors in logs
- All warm emails sent via SendGrid
- All cold leads added to Instantly
- Counters accurate

---

## Monitoring

### Key Metrics to Watch

```sql
-- Daily dispatch stats
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_dispatches,
  SUM(warm_sent) as total_warm,
  SUM(cold_sent) as total_cold,
  ROUND(AVG(warm_opened::float / NULLIF(warm_sent, 0) * 100), 2) as warm_open_rate,
  ROUND(AVG(cold_opened::float / NULLIF(cold_sent, 0) * 100), 2) as cold_open_rate
FROM work_order_outreach
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Success Targets

| Metric | Warm (SendGrid) | Cold (Instantly) |
|--------|----------------|------------------|
| Delivery Rate | > 99% | > 85% |
| Open Rate | > 80% | > 30% |
| Reply Rate | > 15% | > 5% |
| Dispatch Time | < 5 sec | < 10 sec |
| Error Rate | < 1% | < 2% |

---

## Cleanup After Testing

```sql
-- Remove test technicians
DELETE FROM technicians
WHERE email LIKE '%test@example.com'
OR email LIKE '%loadtest.com';

-- Remove test work orders
DELETE FROM jobs
WHERE job_title LIKE 'Test %';

-- Remove test outreach records (cascade will handle recipients)
DELETE FROM work_order_outreach
WHERE job_id IN (SELECT id FROM jobs WHERE job_title LIKE 'Test %');
```

---

## Next Steps

After successful testing:

1. Update to production environment variables
2. Gradually increase sending volume
3. Monitor deliverability for 48 hours
4. Set up alerts for error rates
5. Document any issues encountered
6. Train team on monitoring dashboards

---

## Support

- SendGrid Monitoring: https://app.sendgrid.com/statistics
- Instantly Dashboard: https://app.instantly.ai
- Supabase Logs: Project → Edge Functions → Logs
- Real-time Issues: Check browser console for WebSocket errors
