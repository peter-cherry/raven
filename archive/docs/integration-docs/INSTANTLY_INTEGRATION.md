> Archived on 2026-01-12 from INSTANTLY_INTEGRATION.md. Reason: Completed integration documentation

# Instantly.ai Integration

This document explains how Ravensearch integrates with Instantly.ai for cold email outreach to technicians.

## Overview

Ravensearch uses Instantly.ai to send automated cold email sequences to technicians. The integration allows you to:

1. **Validate campaigns** - Verify Instantly campaign IDs exist before creating campaigns in Ravensearch
2. **Auto-sync campaign data** - Automatically pull campaign name and stats from Instantly
3. **Dispatch leads** - Send technician contact info to Instantly campaigns
4. **Real-time stats updates** - Receive webhooks when emails are sent, opened, or replied to

## Setup

### 1. Get Your Instantly API Key

1. Log in to [Instantly.ai](https://app.instantly.ai)
2. Go to **Settings** → **API & Integrations**
3. Click **Generate API Key**
4. Copy the API key

### 2. Add Environment Variable

Add your Instantly API key to `.env.local`:

```bash
INSTANTLY_API_KEY=your_api_key_here
```

### 3. Configure Webhook (Optional but Recommended)

To receive real-time updates when leads interact with your emails:

1. In Instantly dashboard, go to **Settings** → **Integrations** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/webhooks/instantly`
3. Select events to receive:
   - ✅ Email sent
   - ✅ Email opened
   - ✅ Email clicked
   - ✅ Email replied
   - ✅ Email bounced
4. Save webhook

## Workflow

### Creating a Campaign

```
1. Admin creates email sequence in Instantly.ai
   - Set up subject lines, email copy, delays
   - Configure sending schedule

2. Admin copies Instantly Campaign ID
   - In Instantly dashboard → Campaign → Settings
   - Copy the Campaign ID (e.g., "cam_abc123")

3. Admin creates campaign in Ravensearch
   - Click "+ New Campaign" in Outreach page
   - Paste Instantly Campaign ID
   - System validates campaign exists
   - Auto-populates campaign name from Instantly
   - Select trade filter
   - Click "Create Campaign"
```

### Dispatching Technicians

```
1. Admin collects technicians via scraping
   - Click "Collect Technicians" in Targets tab
   - Specify source (Google, Yelp), trade, state

2. Technicians are enriched
   - System finds email addresses
   - Status changes to "completed" when enriched

3. Admin dispatches to campaign
   - Select technicians to send
   - Choose campaign
   - Click "Dispatch to Campaign"

4. System sends to Instantly
   - Formats technicians as leads
   - Calls Instantly API: POST /lead/add
   - Records dispatch in job_dispatches table
   - Updates campaign stats
```

### Real-Time Updates

When Instantly sends emails, webhooks update your Ravensearch stats automatically:

- **Email Sent** → Increment `emails_sent` counter
- **Email Opened** → Increment `emails_opened` counter, update dispatch status
- **Email Replied** → Increment `replies_received` counter, create notification
- **Email Bounced** → Mark dispatch as bounced with reason

## API Endpoints

### POST `/api/instantly/validate-campaign`

Validates an Instantly campaign ID exists and returns campaign details.

**Request:**
```json
{
  "campaignId": "cam_abc123"
}
```

**Response (Success):**
```json
{
  "valid": true,
  "campaign": {
    "id": "cam_abc123",
    "name": "Q1 2025 HVAC Outreach",
    "status": "active",
    "total_leads": 150,
    "emails_sent": 89,
    "opens": 34,
    "replies": 5
  }
}
```

**Response (Not Found):**
```json
{
  "valid": false,
  "error": "Campaign not found in Instantly. Please check the Campaign ID."
}
```

### POST `/api/instantly/dispatch-leads`

Sends technicians to an Instantly campaign as leads.

**Request:**
```json
{
  "campaignId": "uuid-of-ravensearch-campaign",
  "targetIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "leads_sent": 3,
  "campaign": "Q1 2025 HVAC Outreach"
}
```

### POST `/api/webhooks/instantly`

Receives webhook events from Instantly.ai (configured in Instantly dashboard).

**Event Types:**
- `email.sent`
- `email.opened`
- `email.clicked`
- `email.replied`
- `email.bounced`

## Database Schema

### `outreach_campaigns` Table

```sql
CREATE TABLE outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  instantly_campaign_id TEXT NOT NULL UNIQUE, -- Links to Instantly
  trade_filter TEXT,
  status TEXT DEFAULT 'draft', -- draft | active | paused | completed
  total_targets INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  replies_received INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `job_dispatches` Table

```sql
CREATE TABLE job_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES outreach_targets(id),
  campaign_id UUID REFERENCES outreach_campaigns(id),
  channel TEXT DEFAULT 'instantly', -- instantly | sendgrid
  status TEXT DEFAULT 'pending', -- pending | sent | opened | clicked | replied | bounced
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  reply_text TEXT,
  bounce_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Troubleshooting

### Campaign Validation Fails

**Issue:** "Campaign not found in Instantly"

**Solutions:**
1. Check the Campaign ID is correct (should start with "cam_")
2. Ensure campaign exists in your Instantly account
3. Verify `INSTANTLY_API_KEY` is set in environment variables
4. Check API key has permission to access campaigns

### Leads Not Appearing in Instantly

**Issue:** Dispatch succeeds but leads don't show up in Instantly dashboard

**Solutions:**
1. Check Instantly campaign is not archived
2. Verify email addresses are valid format
3. Check Instantly campaign has not reached lead limit
4. Review Instantly dashboard → Campaign → Leads tab

### Webhooks Not Updating Stats

**Issue:** Emails sent but stats not updating in Ravensearch

**Solutions:**
1. Verify webhook is configured in Instantly dashboard
2. Check webhook URL is correct (must be publicly accessible)
3. Review webhook logs in Instantly dashboard
4. Check server logs for webhook errors: `grep "Instantly Webhook" /var/log/app.log`

## Development

### Testing Instantly Integration

1. **Mock Mode** - Set `INSTANTLY_API_KEY=""` to use mock responses
2. **Test Campaign** - Create a test campaign in Instantly with your own email
3. **Webhook Testing** - Use ngrok to test webhooks locally:

```bash
ngrok http 3000
# Update Instantly webhook URL to: https://abc123.ngrok.io/api/webhooks/instantly
```

### Instantly API Client

The Instantly client is located at `/lib/instantlyClient.ts` and provides methods:

- `getCampaign(campaignId)` - Get campaign details
- `addLeads(campaignId, leads)` - Add leads to campaign
- `getCampaignAnalytics(campaignId)` - Get campaign stats
- `listCampaigns()` - List all campaigns

**Example:**
```typescript
import { instantlyClient } from '@/lib/instantlyClient';

const campaign = await instantlyClient.getCampaign('cam_abc123');
console.log(campaign.name); // "Q1 2025 HVAC Outreach"
```

## Resources

- [Instantly API Documentation](https://developer.instantly.ai/)
- [Instantly Webhooks Guide](https://developer.instantly.ai/webhooks)
- [Campaign Settings](https://app.instantly.ai/app/campaigns)

