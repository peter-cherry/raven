> Archived on 2026-01-12 from COMPOSE_EMAIL_SETUP.md. Reason: Historical setup documentation

# Compose Email Feature - Setup Guide

## Overview

The Compose Email feature allows you to send manual, one-off emails to technicians directly from Ravensearch using SendGrid. This is perfect for:

- ✉️ **Personalized outreach** - Send customized messages to specific technicians
- 🎯 **Follow-ups** - Reach out to interested leads manually
- 📝 **High-value prospects** - Give VIP treatment to top candidates
- 💼 **Professional communication** - Send from your verified domain

---

## ✅ What's Already Built

All code is complete and ready to use! Here's what was created:

### 1. **Compose Email Page** (`/app/admin/compose/page.tsx`)
- ✅ Rich text editor (React Quill) for email composition
- ✅ Recipient selector with search functionality
- ✅ Template library (save/load email templates)
- ✅ Real-time email tracking
- ✅ Glassmorphic UI matching your design system

### 2. **SendGrid API Endpoint** (`/app/api/admin/send-manual-email/route.ts`)
- ✅ Sends emails via SendGrid API
- ✅ Tracks delivery status in database
- ✅ Rate limiting (100ms between emails)
- ✅ Error handling and reporting

### 3. **Database Tables**
- ✅ `email_templates` - Save reusable email templates
- ✅ `manual_emails` - Track all sent emails with status

### 4. **Navigation**
- ✅ Added "Compose Email" link in sidebar menu (bottom profile dropdown)

---

## 🔧 Setup Required (5 minutes)

### Step 1: Get SendGrid API Key

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it: `Raven Compose Emails`
5. Permissions: Select **Full Access** (or **Mail Send** only)
6. Click **Create & View**
7. **COPY THE KEY** (starts with `SG.` - you only see it once!)

### Step 2: Verify Your Domain

1. In SendGrid, go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Enter your domain (e.g., `raven-search.com`)
4. Add the DNS records provided by SendGrid to your domain registrar:

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

Type: TXT
Host: @
Value: v=spf1 include:sendgrid.net ~all

Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@raven-search.com
```

5. Wait for DNS propagation (usually 15 minutes, max 48 hours)
6. Click **Verify** in SendGrid dashboard

### Step 3: Add Environment Variables

Add these to your `.env.local` file:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=jobs@raven-search.com
SENDGRID_FROM_NAME=Raven Jobs
```

### Step 4: Restart Dev Server

```bash
# Stop the dev server (Ctrl+C)
npm run dev
```

---

## 🎉 You're Done!

### Access the Compose Email Page:

**Three ways to get there:**

1. **From Outreach Page:**
   - Go to `/admin/outreach`
   - Click **"Compose Email"** button (top right, next to tabs)

2. **From Sidebar Menu:**
   - Click the **profile button** (bottom of sidebar - shows "P")
   - Click **"Compose Email"** in the dropdown menu

3. **Direct URL:**
   - Navigate to: `http://localhost:3000/admin/outreach/compose`

---

## 🚀 How to Use

### Sending Your First Email:

1. **Select Recipients**
   - Click **"+ Add"** button
   - Search for technicians by name, email, city, or trade
   - Check the boxes next to technicians you want to email
   - Click **"Done"**

2. **Compose Email**
   - Enter a **subject line**
   - Write your message using the **rich text editor**
   - Format with bold, italics, lists, links, etc.

3. **Send**
   - Review your recipient count
   - Click **"✉️ Send to X Recipients"**
   - Emails are sent via SendGrid
   - Track delivery status in database

### Using Templates:

**Save a Template:**
1. Compose your email
2. Click **"💾 Save as Template"**
3. Give it a name (e.g., "HVAC Follow-up")
4. Click **"Save Template"**

**Load a Template:**
1. Click **"📋 Load Template"**
2. Select a saved template
3. Subject and body are populated automatically
4. Customize as needed and send

---

## 📊 Email Tracking

Every email sent is tracked in the `manual_emails` table:

```sql
SELECT
  recipient_name,
  recipient_email,
  subject,
  status,
  sent_at
FROM manual_emails
ORDER BY sent_at DESC
LIMIT 10;
```

**Status values:**
- `sent` - Email delivered successfully
- `failed` - SendGrid API error
- `opened` - Recipient opened email (requires webhook)
- `clicked` - Recipient clicked a link (requires webhook)
- `replied` - Recipient replied (requires webhook)

---

## 📈 Future Enhancements

These features are not yet implemented but can be added easily:

### 1. **SendGrid Webhooks** (for open/click tracking)
Create endpoint: `/app/api/webhooks/sendgrid/route.ts`
```typescript
// Update manual_emails table when events received:
// - email.opened → set opened_at
// - email.clicked → set clicked_at
```

### 2. **Email History Dashboard**
Create page: `/app/admin/emails/page.tsx`
- View all sent emails
- Filter by recipient, status, date
- Resend failed emails
- View open/click rates

### 3. **Merge Tags** (personalization)
```typescript
// Replace {{business_name}}, {{city}}, {{trade}} in email body
const personalizedBody = body
  .replace('{{business_name}}', target.business_name)
  .replace('{{city}}', target.city)
  .replace('{{trade}}', target.trade_type)
```

### 4. **Scheduled Emails**
- Add `scheduled_for` column to `manual_emails`
- Create cron job to send scheduled emails

### 5. **Bulk Actions**
- Select all HVAC technicians in Florida
- Send bulk personalized emails with merge tags

---

## 🐛 Troubleshooting

### Issue: "SendGrid is not configured"

**Solution:** Add `SENDGRID_API_KEY` to `.env.local` and restart server

### Issue: Emails go to spam

**Solutions:**
1. Verify your domain in SendGrid (critical!)
2. Add SPF and DMARC DNS records
3. Start with small batch sizes (< 10 emails/day)
4. Gradually increase volume (warm up your domain)

### Issue: "Sender not verified" error

**Solution:** Complete domain verification in SendGrid dashboard. Check that DNS records propagated:

```bash
# Check DNS records
dig TXT raven-search.com
dig CNAME em1234.raven-search.com
```

### Issue: Rich text editor not loading

**Solution:** This uses client-side rendering. Ensure you're accessing via browser, not SSR.

---

## 💡 Best Practices

### Deliverability Tips:

1. **Authenticate your domain** - Critical for inbox placement
2. **Start small** - Send 10-20 emails/day at first
3. **Gradual increase** - Double volume every week
4. **Personalize** - Use recipient's name and business
5. **Avoid spam words** - No "FREE!", "ACT NOW!", excessive caps
6. **Include unsubscribe link** - Required by law

### Email Content Tips:

1. **Clear subject lines** - "Job Opportunity for HVAC Technicians in Miami"
2. **Personalization** - "Hi John" vs "Hi there"
3. **Value proposition first** - What's in it for them?
4. **Single CTA** - One clear action to take
5. **Mobile-friendly** - Keep it concise and scannable

### Template Ideas:

- **Initial outreach** - Introduce Ravensearch, value proposition
- **Follow-up** - Checking in on interested leads
- **Job alert** - Specific job matching their skills
- **Re-engagement** - Win back cold leads with new incentive

---

## 📋 Checklist

Before sending your first email:

- [ ] SendGrid account created
- [ ] API key generated and added to `.env.local`
- [ ] Domain verified in SendGrid
- [ ] DNS records added (CNAME, SPF, DMARC)
- [ ] From email configured (`SENDGRID_FROM_EMAIL`)
- [ ] Dev server restarted
- [ ] Sent test email to yourself
- [ ] Checked spam folder
- [ ] Verified tracking in `manual_emails` table

---

## 🎯 Quick Start Example

**Send your first test email:**

```typescript
// 1. Add yourself as an outreach target
INSERT INTO outreach_targets (
  email,
  business_name,
  city,
  state,
  trade_type,
  email_found
) VALUES (
  'your@email.com',
  'Test Business',
  'Miami',
  'FL',
  'HVAC',
  true
);

// 2. Navigate to /admin/compose
// 3. Select yourself as recipient
// 4. Compose test email
// 5. Send and check your inbox!
```

---

## 📞 Support

- **SendGrid Docs**: https://docs.sendgrid.com
- **SendGrid Status**: https://status.sendgrid.com
- **SendGrid Support**: https://support.sendgrid.com

---

**Built with Claude Code** 🤖
Ready to send professional emails at scale! ✉️


