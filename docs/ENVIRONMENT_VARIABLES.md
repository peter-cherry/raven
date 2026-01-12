# Environment Variables

## Required Environment Variables for Hybrid Dispatch System

Add these to your `.env.local` file in the project root.

## SendGrid (Warm Dispatch)

```bash
# SendGrid API Key (get from https://app.sendgrid.com/settings/api_keys)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# SendGrid Template ID for work order notifications
# Get from https://mc.sendgrid.com/dynamic-templates
SENDGRID_TEMPLATE_ID_WORK_ORDER=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# SendGrid sender email (must be verified in SendGrid dashboard)
SENDGRID_FROM_EMAIL=jobs@raven-search.com

# SendGrid sender name (appears as "from" in emails)
SENDGRID_FROM_NAME=Raven Jobs
```

## Instantly.ai (Cold Dispatch)

```bash
# Instantly API Key (get from https://app.instantly.ai/app/settings/api)
INSTANTLY_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Campaign IDs for each trade (create campaigns in Instantly dashboard)
INSTANTLY_CAMPAIGN_ID_HANDYMAN=xxxxxxxx
INSTANTLY_CAMPAIGN_ID_HVAC=xxxxxxxx
INSTANTLY_CAMPAIGN_ID_PLUMBING=xxxxxxxx
INSTANTLY_CAMPAIGN_ID_ELECTRICAL=xxxxxxxx
```

## Application Settings

```bash
# Your application URL (used for accept links in emails)
# Production:
APP_URL=https://raven-search.com

# Local development:
# APP_URL=http://localhost:3000
```

## Supabase (Already configured)

```bash
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anon/Public Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Service Role Key (keep secret, server-side only!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Complete .env.local Example

```bash
# ===================================
# Supabase Configuration
# ===================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===================================
# SendGrid (Warm Dispatch)
# ===================================
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_ID_WORK_ORDER=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=jobs@raven-search.com
SENDGRID_FROM_NAME=Raven Jobs

# ===================================
# Instantly.ai (Cold Dispatch)
# ===================================
INSTANTLY_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
INSTANTLY_CAMPAIGN_ID_HANDYMAN=camp_abc123
INSTANTLY_CAMPAIGN_ID_HVAC=camp_def456
INSTANTLY_CAMPAIGN_ID_PLUMBING=camp_ghi789
INSTANTLY_CAMPAIGN_ID_ELECTRICAL=camp_jkl012

# ===================================
# Application Settings
# ===================================
# Production:
APP_URL=https://raven-search.com
# Development:
# APP_URL=http://localhost:3000

# ===================================
# Google Maps (Optional, for geocoding)
# ===================================
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key

# ===================================
# OpenAI (for parser)
# ===================================
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## How to Get API Keys

### SendGrid

1. Sign up at https://sendgrid.com
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name: "Raven Dispatch System"
5. Permissions: **Full Access** (or Mail Send only)
6. Copy key and add to `.env.local`

⚠️ You can only see the API key once - save it immediately!

### Instantly.ai

1. Sign up at https://instantly.ai
2. Go to **Settings** → **API**
3. Copy API key
4. Create campaigns for each trade
5. Get campaign IDs from campaign URLs

### Supabase Service Role Key

1. Go to Supabase dashboard
2. Navigate to **Project Settings** → **API**
3. Copy **service_role** key (NOT the anon key)
4. Keep this secret - it bypasses Row Level Security!

## Security Best Practices

### Never Commit Secrets

Add `.env.local` to `.gitignore`:

``bash
# .gitignore
.env.local
.env.*.local
``

### Use Different Keys for Environments

- **Development**: Use test API keys with limited permissions
- **Staging**: Use separate staging keys
- **Production**: Use production keys with monitoring

### Rotate Keys Regularly

- Rotate SendGrid keys every 90 days
- Rotate Supabase service role key every 180 days
- Immediately rotate if compromised

### Environment-Specific Configuration

For Supabase Edge Functions, set environment secrets:

```bash
# In Supabase dashboard: Settings → Edge Functions → Secrets
supabase secrets set SENDGRID_API_KEY=SG.xxx
supabase secrets set SENDGRID_TEMPLATE_ID_WORK_ORDER=d-xxx
supabase secrets set INSTANTLY_API_KEY=xxx
supabase secrets set APP_URL=https://raven-search.com
```

## Verification Checklist

Before deploying:

- [ ] All variables added to `.env.local`
- [ ] SendGrid API key tested
- [ ] SendGrid template ID correct
- [ ] SendGrid from email verified
- [ ] Instantly API key tested
- [ ] All Instantly campaign IDs set
- [ ] APP_URL correct for environment
- [ ] Supabase URLs correct
- [ ] .env.local in .gitignore
- [ ] Edge Function secrets set (for production)

## Troubleshooting

### "SENDGRID_API_KEY is not defined"

- Check `.env.local` exists in project root
- Restart Next.js dev server after adding variables
- For Edge Functions, set secrets in Supabase dashboard

### "Sender not verified"

- Verify `SENDGRID_FROM_EMAIL` domain in SendGrid
- Wait for DNS propagation
- Check SPF/DKIM records

### "Invalid template ID"

- Check `SENDGRID_TEMPLATE_ID_WORK_ORDER` is correct
- Ensure template is Active in SendGrid
- Template ID starts with `d-`

### "Instantly campaign not found"

- Verify campaign IDs in Instantly dashboard
- Check trade name matches exactly ("HVAC" not "hvac")
- Ensure campaigns are active

## Testing Environment Variables

Create a test script:

```typescript
// scripts/test-env.ts
console.log('Testing environment variables...\n')

const vars = {
  'SENDGRID_API_KEY': process.env.SENDGRID_API_KEY,
  'SENDGRID_TEMPLATE_ID': process.env.SENDGRID_TEMPLATE_ID_WORK_ORDER,
  'SENDGRID_FROM_EMAIL': process.env.SENDGRID_FROM_EMAIL,
  'INSTANTLY_API_KEY': process.env.INSTANTLY_API_KEY,
  'APP_URL': process.env.APP_URL
}

for (const [key, value] of Object.entries(vars)) {
  const status = value ? '✅' : '❌'
  const display = value ? value.substring(0, 20) + '...' : 'NOT SET'
  console.log(`${status} ${key}: ${display}`)
}
```

Run with:

```bash
npx ts-node scripts/test-env.ts
```

## Support

- SendGrid Docs: https://docs.sendgrid.com
- Instantly Docs: https://help.instantly.ai
- Supabase Docs: https://supabase.com/docs
