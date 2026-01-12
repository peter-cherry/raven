# SendGrid Email Template Setup

## Overview

This guide explains how to create the SendGrid email template for warm technician dispatch.

## Prerequisites

1. SendGrid account (sign up at https://sendgrid.com)
2. Domain verified in SendGrid (`jobs@raven-search.com`)
3. API key with "Mail Send" permissions

## Step 1: Create Dynamic Template

1. Log in to SendGrid dashboard
2. Navigate to **Email API** → **Dynamic Templates**
3. Click **Create a Dynamic Template**
4. Name it: `Work Order Notification`
5. Click **Add Version** → **Blank Template** → **Code Editor**

## Step 2: Template HTML

Paste this HTML into the code editor:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Job Opportunity</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">🔧 New Job Match!</h1>
  </div>

  <!-- Body -->
  <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi {{tech_name}},
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Great news! A new <strong>{{job_type}}</strong> job matching your skills is available through Raven.
    </p>

    <!-- Job Details Card -->
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">Job Details</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #666;">Trade:</td>
          <td style="padding: 8px 0; color: #333;">{{job_type}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Location:</td>
          <td style="padding: 8px 0; color: #333;">{{location}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Urgency:</td>
          <td style="padding: 8px 0;">
            <span style="background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600;">
              {{urgency}}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Budget:</td>
          <td style="padding: 8px 0; color: #333;">{{budget}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Scheduled:</td>
          <td style="padding: 8px 0; color: #333;">{{scheduled}}</td>
        </tr>
      </table>

      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
        <strong style="color: #666;">Description:</strong>
        <p style="margin: 10px 0 0 0; color: #333;">{{description}}</p>
      </div>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{accept_url}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
        Accept This Job
      </a>
    </div>

    <!-- Disclaimer -->
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      This job was sent to you because you're a verified technician in the Raven network.
      If you're not available, no worries – just ignore this email.
    </p>

    <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
      Job ID: #{{work_order_id}}
    </p>
  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 5px 0;">© 2025 Raven Search. All rights reserved.</p>
    <p style="margin: 5px 0;">
      <a href="https://raven-search.com/unsubscribe?email={{tech_email}}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a> |
      <a href="https://raven-search.com/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy Policy</a>
    </p>
  </div>

  <!-- Tracking Pixel (invisible) -->
  <img src="{{tracking_pixel}}" width="1" height="1" alt="" style="display:none;" />

</body>
</html>
```

## Step 3: Test Data

Click **Test Your Template** and use this test data:

```json
{
  "tech_name": "John",
  "job_type": "HVAC",
  "location": "123 Main St, Miami, FL 33131",
  "urgency": "High",
  "description": "Air conditioning unit not cooling properly. Customer reports warm air from all vents.",
  "budget": "$500",
  "scheduled": "October 25, 2025",
  "accept_url": "https://raven-search.com/jobs/test-123/accept",
  "work_order_id": "test-123",
  "tech_email": "tech@example.com",
  "tracking_pixel": "https://your-supabase-url.supabase.co/functions/v1/track-email-open?outreach=123&tech=456"
}
```

## Step 4: Save Template

1. Click **Save Template**
2. Copy the **Template ID** (looks like `d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
3. Add it to your `.env.local` file as `SENDGRID_TEMPLATE_ID_WORK_ORDER`

## Step 5: Domain Verification

### Verify Sender Domain

1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Enter `raven-search.com`
4. Follow instructions to add DNS records:

```
Type: CNAME
Host: em1234
Value: u1234567.wl.sendgrid.net

Type: CNAME
Host: s1._domainkey
Value: s1.domainkey.u1234567.wl.sendgrid.net

Type: CNAME
Host: s2._domainkey
Value: s2.domainkey.u1234567.wl.sendgrid.net
```

5. Wait for DNS propagation (can take up to 48 hours, usually 15 minutes)
6. Verify domain in SendGrid dashboard

### Add SPF Record

Add to your DNS:

```
Type: TXT
Host: @
Value: v=spf1 include:sendgrid.net ~all
```

### Add DMARC Record

Add to your DNS:

```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@raven-search.com
```

## Step 6: Create API Key

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: `Raven Dispatch System`
4. Permissions: **Full Access** (or **Mail Send** only)
5. Copy the API key (starts with `SG.`)
6. Add to `.env.local` as `SENDGRID_API_KEY`

⚠️ **IMPORTANT**: Save the API key immediately - you can only see it once!

## Step 7: Set From Address

Add to `.env.local`:

```bash
SENDGRID_FROM_EMAIL=jobs@raven-search.com
SENDGRID_FROM_NAME=Raven Jobs
```

## Template Variables Reference

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `tech_name` | string | "John" | Technician's first name |
| `job_type` | string | "HVAC" | Trade/service type |
| `location` | string | "123 Main St, Miami, FL" | Job address |
| `urgency` | string | "High" | Priority level |
| `description` | string | "AC not cooling..." | Job description |
| `budget` | string | "$500" | Budget or "TBD" |
| `scheduled` | string | "Oct 25, 2025" | Scheduled date or "ASAP" |
| `accept_url` | string | "https://..." | Link to accept job |
| `work_order_id` | string | "abc-123" | Job ID for reference |
| `tech_email` | string | "tech@example.com" | Tech's email (for unsubscribe) |
| `tracking_pixel` | string | "https://..." | Invisible tracking image |

## Testing Checklist

Before going live:

- [ ] Template created and saved in SendGrid
- [ ] Test email sent successfully
- [ ] Template ID added to `.env.local`
- [ ] Domain verified in SendGrid
- [ ] DNS records (CNAME, SPF, DMARC) added
- [ ] API key created and added to `.env.local`
- [ ] From address configured
- [ ] Test dispatch sent to your own email
- [ ] Tracking pixel loads correctly
- [ ] Accept button links work
- [ ] Unsubscribe link works
- [ ] Email renders correctly in Gmail, Outlook, Apple Mail

## Troubleshooting

### "Sender not verified" error

- Ensure domain is fully verified in SendGrid
- Wait for DNS propagation
- Check CNAME records are correct

### Email goes to spam

- Add SPF and DMARC records
- Warm up your sending domain gradually
- Start with small batch sizes

### Template not found

- Double-check Template ID in `.env.local`
- Ensure template is in "Active" status in SendGrid

### Variables not rendering

- Check JSON syntax in template test data
- Ensure variable names match exactly (case-sensitive)
- Use `{{variable}}` syntax, not `{variable}`

## Monitoring

After launch, monitor in SendGrid dashboard:

- **Activity Feed**: Real-time email events
- **Stats**: Delivery, open, click rates
- **Suppressions**: Bounces, spam reports, unsubscribes

Target metrics:
- Delivery rate: > 99%
- Open rate: > 80% (for warm techs)
- Click rate: > 15%

## Support

- SendGrid Docs: https://docs.sendgrid.com
- Status Page: https://status.sendgrid.com
- Support: https://support.sendgrid.com
