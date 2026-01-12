> Archived on 2026-01-12 from SENTRY_SETUP.md. Reason: Historical setup documentation

# Sentry Setup Guide

Sentry error tracking has been configured for the Raven Claude project.

## What's Configured

✅ **Installed**: `@sentry/nextjs` SDK
✅ **Client-side tracking**: Browser errors, session replay
✅ **Server-side tracking**: API route errors, server errors
✅ **Edge runtime tracking**: Middleware and edge function errors
✅ **Performance monitoring**: Automatic tracing
✅ **Source maps**: Uploaded for better stack traces
✅ **Ad-blocker bypass**: `/monitoring` tunnel route

## Next Steps

### 1. Create a Sentry Account

1. Go to https://sentry.io/signup/
2. Create a new account (free tier available)
3. Create a new project
   - Platform: **Next.js**
   - Project name: `raven-claude` (or your preference)

### 2. Get Your Sentry DSN

After creating the project, Sentry will show you a DSN that looks like:
```
https://xxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/1234567
```

### 3. Configure Environment Variables

#### Local Development (`.env.local`):

```bash
# Sentry - Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@oxxxxx.ingest.sentry.io/xxxxxx
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=raven-claude
SENTRY_AUTH_TOKEN=your-auth-token-here
```

#### Vercel Production:

Add these environment variables in your Vercel project settings:

1. Go to https://vercel.com/ravensearch/raven-claude/settings/environment-variables
2. Add each variable:
   - `NEXT_PUBLIC_SENTRY_DSN` - Your Sentry DSN (available to browser)
   - `SENTRY_ORG` - Your organization slug
   - `SENTRY_PROJECT` - Your project name
   - `SENTRY_AUTH_TOKEN` - Create at https://sentry.io/settings/account/api/auth-tokens/

**Important:** Mark `NEXT_PUBLIC_SENTRY_DSN` as available to **all environments** (Production, Preview, Development).

### 4. Get Auth Token for Source Maps

1. Go to https://sentry.io/settings/account/api/auth-tokens/
2. Click "Create New Token"
3. Name: "Vercel Deployment"
4. Scopes needed:
   - `project:read`
   - `project:releases`
   - `org:read`
5. Copy the token and add to Vercel environment variables as `SENTRY_AUTH_TOKEN`

### 5. Update `.sentryclirc` (Optional)

For local development, you can add your credentials to `.sentryclirc`:

```ini
[auth]
token=YOUR_AUTH_TOKEN_HERE

[defaults]
org=your-organization-slug
project=raven-claude
```

**⚠️ Warning:** Never commit `.sentryclirc` with real tokens! It's already in `.gitignore`.

## Features Enabled

### Error Tracking
All JavaScript errors, API errors, and unhandled rejections are automatically captured and sent to Sentry.

### Session Replay
When an error occurs, Sentry captures a video-like replay of the user's session leading up to the error (with sensitive data masked).

### Performance Monitoring
Tracks page load times, API response times, and identifies slow operations.

### Breadcrumbs
Captures user interactions (clicks, navigations, console logs) to help debug issues.

### Source Maps
Source maps are automatically uploaded on deployment so stack traces show your actual code, not minified bundles.

## Testing Sentry

After configuration, you can test Sentry by triggering an error:

### Client-side Test:
Create a test page or button:
```tsx
<button onClick={() => {
  throw new Error('Test Sentry Error')
}}>
  Trigger Test Error
</button>
```

### Server-side Test:
Add to an API route:
```typescript
import * as Sentry from '@sentry/nextjs'

export async function GET() {
  try {
    throw new Error('Test Server Error')
  } catch (error) {
    Sentry.captureException(error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
```

## Viewing Errors

1. Go to https://sentry.io
2. Select your project
3. View errors in the "Issues" tab
4. Click on an issue to see:
   - Stack trace
   - Breadcrumbs (user actions)
   - Session replay (if available)
   - User context
   - Device/browser info

## Sentry + Raven Agent Integration

The Raven Agent system prompt includes "Query Sentry for errors" as a capability. Once configured, you could add a Sentry MCP server or API integration to allow the agent to:

- Query recent errors
- Get error statistics
- Identify patterns in failures
- Automatically create work items for critical errors

## Cost

- **Free Tier**: 5,000 errors/month, 50 replays/month
- **Team Plan**: $26/month - 50,000 errors/month, 500 replays/month
- See pricing: https://sentry.io/pricing/

## Support

- Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Discord: https://discord.gg/sentry

---

Generated with Claude Code

