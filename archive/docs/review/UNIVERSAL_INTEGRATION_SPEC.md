> Archived on 2026-01-12 from UNIVERSAL_INTEGRATION_SPEC.md. Reason: Review needed - may contain active specifications

# Universal CMMS Integration System - Technical Specification

## Project Overview

Build a universal integration system for Raven Search that allows property managers to connect ANY CMMS platform (Corrigo, ServiceTitan, BuildOps, or any other work order management system) through a single "Connect Your CMMS" button. The system should automatically discover the platform's API structure, handle authentication, import technician data, and enable bi-directional work order sync.

## Core Principle

**The user should never need to know how their CMMS API works. The system figures it out automatically.**

## System Architecture

### Components to Build

1. **MCP Integration Server** - Background service that handles API discovery, authentication, and data sync
2. **Next.js API Routes** - Frontend interface to the MCP server
3. **Supabase Database Schema** - Store credentials, configurations, imported data
4. **React UI Components** - Settings page for integration management

### Technology Stack

- MCP Server: Node.js/TypeScript with Express
- Frontend: Next.js 15, React 19, TypeScript
- Styling: Tailwind CSS v4 (dark theme #2A2931, purple accents #6C72C9)
- Database: Supabase
- Authentication: OAuth 2.0, API Keys (dynamic based on platform)

## Phase 1: MCP Integration Server

### Core MCP Tools to Implement

#### Tool 1: `integration_discover`
**Purpose:** Given a platform name, URL, or API documentation link, discover how to connect to it.

**Input:**
```typescript
{
  platform_hint?: string,           // "Corrigo", "ServiceTitan", etc.
  api_docs_url?: string,            // "https://developer.corrigo.com"
  company_website?: string          // "corrigo.com"
}
```

**Process:**
1. Search for API documentation using the hint
2. Fetch API documentation (look for OpenAPI/Swagger specs first)
3. If OpenAPI exists, parse it automatically
4. If not, use Claude to analyze HTML documentation
5. Identify authentication method (OAuth 2.0, API Key, Basic Auth)
6. Identify base URL and key endpoints
7. Return structured configuration

**Output:**
```typescript
{
  platform_name: string,
  platform_detected: boolean,
  api_docs_url: string,
  api_base_url: string,
  
  auth_config: {
    type: "oauth2" | "api_key" | "basic" | "custom",
    oauth_urls?: {
      authorize_url: string,
      token_url: string,
      scopes: string[]
    },
    api_key_config?: {
      header_name: string,
      parameter_name?: string
    }
  },
  
  endpoints: {
    technicians?: {
      list: { method: string, path: string },
      get?: { method: string, path: string }
    },
    work_orders?: {
      list: { method: string, path: string },
      create: { method: string, path: string },
      update?: { method: string, path: string }
    }
  },
  
  webhooks_supported: boolean,
  rate_limits?: {
    requests_per_hour: number
  }
}
```

#### Tool 2: `integration_connect`
**Purpose:** Execute the connection flow for a discovered platform.

**Input:**
```typescript
{
  user_id: string,
  platform_config: PlatformConfig,  // Output from integration_discover
  callback_url: string
}
```

**Process:**
1. If OAuth: Generate state token, build authorization URL
2. If API Key: Return prompt for user to enter key
3. If Basic Auth: Return prompt for credentials
4. Store connection state in database temporarily

**Output:**
```typescript
{
  connection_type: "oauth" | "api_key" | "basic",
  oauth_url?: string,
  state?: string,
  prompt_message?: string,
  next_step: string
}
```

#### Tool 3: `integration_oauth_callback`
**Purpose:** Handle OAuth callback and exchange code for tokens.

**Input:**
```typescript
{
  code: string,
  state: string
}
```

**Process:**
1. Decode state to get user_id and platform
2. Exchange authorization code for access/refresh tokens
3. Test connection with a simple API call
4. Store encrypted credentials in Supabase
5. Mark integration as connected

#### Tool 4: `integration_import_technicians`
**Purpose:** Import all technicians from the connected CMMS.

**Input:**
```typescript
{
  user_id: string,
  platform_name: string
}
```

**Process:**
1. Fetch stored credentials for user/platform
2. Call the technicians/providers endpoint
3. Parse response and map fields to Raven schema
4. Handle pagination if needed
5. Deduplicate based on phone/email
6. Import into Supabase `technicians` table
7. Store external system ID mapping
8. Trigger compliance verification requests

**Output:**
```typescript
{
  imported_count: number,
  duplicates_found: number,
  technicians: Array<{
    id: string,
    name: string,
    external_id: string,
    compliance_status: "pending_verification"
  }>
}
```

#### Tool 5: `integration_map_schema`
**Purpose:** Automatically map CMMS data fields to Raven's schema.

**Input:**
```typescript
{
  platform_name: string,
  sample_data: any,  // Example technician or work order object
  target_schema: "technician" | "work_order"
}
```

**Process:**
1. Analyze field names in sample data
2. Use Claude to intelligently map to Raven fields
3. Look for common patterns (id, name, phone, email, etc.)
4. Return mapping with confidence scores
5. Flag unmapped fields for user review

**Output:**
```typescript
{
  mapping: {
    [external_field: string]: string  // Raven field name
  },
  confidence: {
    [external_field: string]: number  // 0-100
  },
  unmapped_fields: string[],
  suggested_mapping_complete: boolean
}
```

#### Tool 6: `integration_sync_work_order`
**Purpose:** Push a work order created in Raven back to the CMMS.

**Input:**
```typescript
{
  user_id: string,
  platform_name: string,
  raven_job_id: string
}
```

**Process:**
1. Fetch job details from Raven database
2. Fetch assigned technician's external_id for this platform
3. Map Raven fields to CMMS fields using stored mapping
4. Create work order via CMMS API
5. Store external_job_id in Raven database
6. Optionally attach compliance documents

**Output:**
```typescript
{
  success: boolean,
  external_job_id?: string,
  error?: string
}
```

### MCP Server Structure

```
mcp-universal-integration/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # MCP server setup
│   ├── server.ts                   # Express HTTP server
│   ├── tools/
│   │   ├── discover.ts             # integration_discover
│   │   ├── connect.ts              # integration_connect
│   │   ├── oauth-callback.ts       # OAuth handling
│   │   ├── import-technicians.ts   # Data import
│   │   ├── map-schema.ts           # Field mapping
│   │   └── sync-work-order.ts      # Push to CMMS
│   ├── utils/
│   │   ├── api-discovery.ts        # Find and parse API docs
│   │   ├── oauth.ts                # OAuth flow helpers
│   │   ├── encryption.ts           # Credential encryption
│   │   └── supabase.ts             # Database client
│   └── config/
│       └── common-patterns.ts      # Known field patterns for mapping
```

## Phase 2: Database Schema

### Tables to Create in Supabase

```sql
-- Store platform configurations discovered by MCP
create table integration_platforms (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  display_name text not null,
  api_base_url text not null,
  api_docs_url text,
  
  auth_config jsonb not null,
  -- Example: { "type": "oauth2", "authorize_url": "...", "token_url": "..." }
  
  endpoints jsonb not null,
  -- Example: { "technicians": { "list": { "method": "GET", "path": "/providers" } } }
  
  schema_mapping jsonb,
  -- Example: { "technician": { "ProviderId": "id", "Name": "name" } }
  
  webhooks_supported boolean default false,
  rate_limits jsonb,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Store user credentials for connected platforms
create table integration_credentials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  platform_id uuid references integration_platforms not null,
  
  credentials jsonb not null,
  -- Encrypted: { "access_token": "...", "refresh_token": "...", "expires_at": "..." }
  -- OR: { "api_key": "..." }
  
  connection_status text default 'active',
  last_tested_at timestamptz,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(user_id, platform_id)
);

-- Store imported technicians
create table technicians (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  
  -- Basic info
  name text not null,
  company text,
  phone text,
  email text,
  
  -- Service info
  trades text[],
  service_areas jsonb,
  hourly_rate numeric,
  
  -- Compliance (Raven's value)
  compliance_score integer default 0,
  compliance_grade text,
  coi_verified boolean default false,
  coi_expiration date,
  license_verified boolean default false,
  license_number text,
  background_check_status text default 'pending',
  
  -- Performance data
  jobs_completed integer default 0,
  average_rating numeric,
  
  -- External system mappings
  external_systems jsonb,
  -- Example: { "corrigo": "provider_12345", "servicetitan": "tech_67890" }
  
  imported_from text,
  imported_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Store jobs created in Raven
create table jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  
  title text not null,
  description text,
  trade_type text not null,
  
  location jsonb not null,
  -- { "address": "...", "lat": 25.7617, "lng": -80.1918 }
  
  scheduled_date timestamptz,
  urgency text,
  estimated_duration text,
  
  -- Assignment
  assigned_tech_id uuid references technicians,
  assigned_at timestamptz,
  
  -- Compliance verification
  compliance_verified boolean default false,
  compliance_docs jsonb,
  
  -- CMMS sync
  synced_to_cmms boolean default false,
  external_job_id text,
  platform_name text,
  
  -- Budget
  not_to_exceed numeric,
  estimated_cost numeric,
  
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sync logs for monitoring
create table integration_sync_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  platform_name text not null,
  
  operation text not null,
  -- 'import_technicians' | 'sync_work_order' | 'test_connection'
  
  status text not null,
  -- 'success' | 'error' | 'partial'
  
  records_processed integer,
  error_message text,
  details jsonb,
  
  created_at timestamptz default now()
);

-- Row Level Security
alter table integration_credentials enable row level security;
alter table technicians enable row level security;
alter table jobs enable row level security;
alter table integration_sync_logs enable row level security;

create policy "Users manage own integrations"
  on integration_credentials for all
  using (auth.uid() = user_id);

create policy "Users manage own technicians"
  on technicians for all
  using (auth.uid() = user_id);

create policy "Users manage own jobs"
  on jobs for all
  using (auth.uid() = user_id);

create policy "Users view own logs"
  on integration_sync_logs for select
  using (auth.uid() = user_id);
```

## Phase 3: Next.js API Routes

### API Endpoints to Create

**File: `app/api/integrations/discover/route.ts`**
```
POST /api/integrations/discover
Body: { platform_hint?, api_docs_url?, company_website? }
→ Calls MCP integration_discover
→ Returns platform configuration
```

**File: `app/api/integrations/connect/route.ts`**
```
POST /api/integrations/connect
Body: { platform_name, platform_config }
→ Calls MCP integration_connect
→ Returns OAuth URL or prompts for credentials
```

**File: `app/api/integrations/oauth-callback/route.ts`**
```
GET /api/integrations/oauth-callback?code=...&state=...
→ Calls MCP integration_oauth_callback
→ Stores credentials
→ Redirects to settings page with success message
```

**File: `app/api/integrations/import/route.ts`**
```
POST /api/integrations/import
Body: { platform_name }
→ Calls MCP integration_import_technicians
→ Returns import results
```

**File: `app/api/integrations/status/route.ts`**
```
GET /api/integrations/status
→ Returns list of connected platforms and sync status
```

**File: `app/api/integrations/disconnect/route.ts`**
```
POST /api/integrations/disconnect
Body: { platform_name }
→ Removes credentials from database
```

## Phase 4: React UI Components

### Page: Settings → Integrations

**File: `app/settings/integrations/page.tsx`**

**UI Requirements:**
- Use dark theme (#2A2931) with purple accents (#6C72C9)
- Clean, minimal design matching existing Raven Search aesthetic
- Loading states for async operations
- Error handling with user-friendly messages

**Components Needed:**

1. **UniversalConnectButton** - Main CTA to start connection flow
2. **PlatformDiscoveryModal** - Prompt for platform name/URL
3. **ConnectionStatusCard** - Shows connected platform, last sync, actions
4. **ImportProgressIndicator** - Shows technician import progress
5. **SyncLog** - Display recent sync operations

**User Flow:**
1. User sees "Connect Your CMMS" button
2. Clicks → Modal opens: "Which CMMS platform do you use?"
3. User enters "Corrigo" or paste API docs URL
4. System discovers platform → Shows: "Found Corrigo! Ready to connect"
5. User clicks "Connect" → OAuth flow or credential prompt
6. After auth → Starts importing technicians automatically
7. Shows progress: "Importing 127 technicians... 45/127"
8. When complete → "✅ Connected to Corrigo. 127 technicians imported. Running compliance checks..."

## Phase 5: Testing Strategy

### Test Cases

**Test 1: Corrigo Integration**
- Discover Corrigo API from "Corrigo" hint
- Complete OAuth flow
- Import technicians
- Verify schema mapping
- Create work order in Raven
- Sync back to Corrigo

**Test 2: ServiceTitan Integration**
- Repeat above with ServiceTitan
- Verify NO code changes needed
- Should "just work" with discovery system

**Test 3: Obscure Platform**
- Test with lesser-known CMMS
- Provide API documentation URL
- Verify system can still figure it out

**Test 4: Error Handling**
- Invalid credentials
- Rate limit exceeded
- API endpoint returns error
- Network timeout

## Success Criteria

✅ User can connect any CMMS platform through one button
✅ System automatically discovers API structure
✅ OAuth and API key auth both work
✅ Technicians import successfully with field mapping
✅ Work orders created in Raven sync back to CMMS
✅ No platform-specific code needed for new integrations
✅ Clear error messages when something fails
✅ Credentials stored encrypted in Supabase

## Environment Variables Needed

```bash
# MCP Server
MCP_SERVER_PORT=3001
ENCRYPTION_KEY=<generate secure key>

# Supabase
SUPABASE_URL=<your instance>
SUPABASE_ANON_KEY=<your key>
SUPABASE_SERVICE_KEY=<your service key>

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3001

# Anthropic API (for Claude-powered discovery)
ANTHROPIC_API_KEY=<your key>
```

## Implementation Notes

### Start Here
1. Create MCP server with `integration_discover` tool first
2. Test it manually with Corrigo and ServiceTitan
3. Once discovery works, add `integration_connect`
4. Then build the Next.js UI to call these tools
5. Finally add import and sync functionality

### Don't Overthink
- Start with OAuth 2.0 support (most modern APIs use this)
- Add API key support second
- Basic auth can come later
- Focus on getting ONE full flow working end-to-end

### Claude Code Tips
- Use web_search to find API documentation URLs
- Use web_fetch to download OpenAPI specs
- Ask Claude to analyze documentation and suggest field mappings
- Let Claude write the OAuth flow boilerplate

### Security
- Never store credentials unencrypted
- Use AES-256 for encryption
- Rotate encryption keys regularly
- Validate all user inputs
- Sanitize data from external APIs

## Deliverables

1. Working MCP server with all 6 tools
2. Supabase schema migrated
3. Next.js API routes implemented
4. React UI for settings/integrations page
5. End-to-end test passing with at least one real CMMS
6. Documentation for adding platform-specific overrides if needed

## Questions to Answer During Implementation

1. How do we handle platforms with non-standard authentication?
2. What's the fallback when API documentation is poor/missing?
3. Should we cache discovered platform configurations?
4. How often should we re-verify stored credentials?
5. What's the user experience when import fails partway through?

## Future Enhancements (Not MVP)

- Webhook support for real-time sync
- Two-way status updates (job completion flows back)
- Automatic compliance document attachment to CMMS
- Platform-specific optimizations based on usage patterns
- Admin dashboard to see all discovered platforms
- Marketplace of pre-configured platforms

---

## Ready to Build

This spec should give Claude Code everything needed to implement the universal integration system. Start with the MCP server and test discovery with real platforms. Once that works, the rest will flow naturally.

Focus on making the discovery robust - that's the core innovation. Everything else is standard CRUD operations.

