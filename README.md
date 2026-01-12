# Raven Search - Contractor Dispatch Platform

**AI-powered platform for matching and dispatching licensed contractors to service jobs.**

---

## Architecture Overview

Raven Search is built on a **three-tier data pipeline** that transforms raw state licensing data into verified, dispatch-ready contractor leads. The platform serves as an intermediary between property managers/IFM companies and licensed tradespeople.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RAVEN SEARCH ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │   State      │    │   Staging    │    │   Verified   │    │ Dispatch │  │
│  │  License     │───▶│   Table      │───▶│  Cold Leads  │───▶│  Queue   │  │
│  │   Files      │    │              │    │              │    │          │  │
│  │  (CSV/API)   │    │ license_     │    │  cold_leads  │    │ Instantly│  │
│  │              │    │ records      │    │              │    │ Campaign │  │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────┘  │
│         │                   │                   │                   │       │
│         ▼                   ▼                   ▼                   ▼       │
│    [FL DBPR]          [AI Selection]     [Hunter.io]         [SendGrid]    │
│    [CA CSLB]          [Trade Match]      [Email Verify]      [Instantly]   │
│                       [Geo Filter]       [Confidence 70%+]                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Design Philosophy

### Why This Architecture?

**1. Separation of Raw Data from Verified Data**

State licensing databases contain hundreds of thousands of records, but most lack email addresses or have outdated contact info. By separating the pipeline into stages:

- **Staging (`license_records`)**: Raw import, no verification required
- **Verified (`cold_leads`)**: Only records with verified emails make it here
- **Dispatch**: Only verified leads get sent to campaigns

This prevents wasted API credits and ensures only quality leads enter the dispatch queue.

**2. AI-Powered Selection Over Bulk Processing**

Rather than verifying every record (expensive), we use AI to:
- Score contractors based on job requirements
- Filter by trade, location, and license status
- Select top candidates for verification

This reduces Hunter.io API usage from thousands of calls to ~10-20 per job.

**3. Multi-Source Lead Aggregation**

Different states have different licensing systems:
- **Florida (DBPR)**: CSV download with occupation codes
- **California (CSLB)**: API access with license classification

The staging table normalizes these into a consistent schema, allowing unified processing regardless of source.

**4. Dual-Channel Dispatch**

- **Warm leads** (registered technicians): SendGrid for transactional email
- **Cold leads** (license database): Instantly for drip campaigns

This respects email deliverability best practices - cold outreach through dedicated infrastructure, warm communications through standard transactional email.

---

## Database Schema

### Core Tables

#### `license_records` (Staging)
Raw contractor data imported from state licensing databases.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `source` | TEXT | Data source (dbpr, cslb, apify) |
| `license_number` | TEXT | State license number |
| `license_status` | TEXT | active, inactive, revoked |
| `license_classification` | TEXT | Raw occupation text from source |
| `business_name` | TEXT | Company or individual name |
| `full_name` | TEXT | Contact name |
| `first_name` | TEXT | Parsed first name |
| `last_name` | TEXT | Parsed last name |
| `phone` | TEXT | Contact phone |
| `address` | TEXT | Full address |
| `city` | TEXT | City |
| `state` | TEXT | State code (FL, CA) |
| `zip` | TEXT | ZIP code |
| `trade_type` | TEXT | Normalized trade (HVAC, Plumbing, Electrical, General) |
| `ai_selected` | BOOLEAN | Selected by AI for verification |
| `ai_score` | INTEGER | AI ranking score (0-100) |
| `ai_selection_reason` | TEXT | Why AI selected this record |
| `selected_for_job_id` | UUID | Job this record was selected for |
| `email` | TEXT | Email (populated after Hunter.io) |
| `email_verified` | BOOLEAN | Email verification status |
| `email_verification_date` | TIMESTAMP | When email was verified |
| `hunter_confidence` | INTEGER | Hunter.io confidence score |
| `moved_to_cold_leads` | BOOLEAN | Whether moved to cold_leads |
| `cold_lead_id` | UUID | Reference to cold_leads record |

**Design Decision**: This table is intentionally denormalized. It serves as a working table where records are enriched progressively. The `ai_*` fields track selection history, enabling analysis of which contractors get selected and why.

#### `cold_leads` (Verified)
Verified contractor leads ready for dispatch.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `email` | TEXT | Verified email address |
| `first_name` | TEXT | Contact first name |
| `last_name` | TEXT | Contact last name |
| `business_name` | TEXT | Company name |
| `phone` | TEXT | Phone number |
| `city` | TEXT | City |
| `state` | TEXT | State |
| `trade_type` | TEXT | Trade category |
| `source_license_id` | UUID | Reference to license_records |
| `hunter_confidence` | INTEGER | Email confidence score |
| `dispatch_count` | INTEGER | Times dispatched |
| `last_dispatched_at` | TIMESTAMP | Last dispatch time |
| `instantly_lead_id` | TEXT | Instantly platform ID |
| `campaign_id` | TEXT | Assigned Instantly campaign |

**Design Decision**: `dispatch_count` prevents over-contacting the same lead. Records with high dispatch counts are deprioritized or excluded from new campaigns.

#### `outreach_targets` (Legacy)
Original outreach system - being migrated to `license_records`.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `business_name` | TEXT | Company name |
| `contact_name` | TEXT | Contact person |
| `email` | TEXT | Email address |
| `phone` | TEXT | Phone number |
| `trade_type` | TEXT | Trade category |
| `data_source` | TEXT | Where data came from |
| `email_found` | BOOLEAN | Email discovery status |
| `email_verified` | BOOLEAN | Verification status |
| `hunter_confidence` | INTEGER | Confidence score |
| `status` | TEXT | pending, enriched, failed |

#### `jobs` (Work Orders)
Service requests from property managers.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `org_id` | UUID | Organization owner |
| `title` | TEXT | Job title |
| `description` | TEXT | Job details |
| `trade_needed` | TEXT | Required trade |
| `address` | TEXT | Service location |
| `city` | TEXT | City |
| `state` | TEXT | State |
| `lat` | FLOAT | Latitude |
| `lng` | FLOAT | Longitude |
| `status` | TEXT | pending, assigned, completed |
| `urgency` | TEXT | Priority level |
| `budget` | DECIMAL | Budget amount |
| `raw_text` | TEXT | Original AI-parsed text |
| `compliance_policy_id` | UUID | Required compliance policy |

#### `technicians` (Registered Contractors)
Contractors who have signed up on the platform.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Auth user reference |
| `org_id` | UUID | Organization |
| `name` | TEXT | Display name |
| `email` | TEXT | Email address |
| `phone` | TEXT | Phone number |
| `trade_types` | TEXT[] | Array of trades |
| `lat` | FLOAT | Service area center |
| `lng` | FLOAT | Service area center |
| `service_radius` | INTEGER | Miles willing to travel |
| `is_available` | BOOLEAN | Accepting jobs |
| `signed_up` | BOOLEAN | Completed registration |
| `rating` | DECIMAL | Average rating |

**Design Decision**: `signed_up` distinguishes between warm (registered) and cold (imported) technicians. This determines dispatch channel (SendGrid vs Instantly).

#### `work_order_outreach` (Dispatch Tracking)
Tracks every dispatch attempt for analytics.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `job_id` | UUID | Job reference |
| `technician_id` | UUID | Technician dispatched to |
| `channel` | TEXT | sendgrid or instantly |
| `status` | TEXT | sent, opened, clicked, replied |
| `sent_at` | TIMESTAMP | When sent |
| `opened_at` | TIMESTAMP | When opened |
| `clicked_at` | TIMESTAMP | When clicked |
| `replied_at` | TIMESTAMP | When replied |

---

## Lead Pipeline Flow

### Stage 1: Import
State licensing files are imported via CSV upload or API.

```
/api/leads/import/florida   → Parses FL DBPR CSV
/api/leads/import/california → Parses CA CSLB data
```

**Theory**: Different states have different formats. The import routes normalize data into the `license_records` schema, mapping state-specific occupation codes to our trade categories (HVAC, Plumbing, Electrical, General).

### Stage 2: AI Selection
When a job is created, AI selects best candidates.

```typescript
// lib/ai-lead-selector.ts
selectContractors({
  jobCity: 'Orlando',
  jobState: 'FL',
  tradeNeeded: 'HVAC',
  limit: 20
})
```

**Theory**: Rather than verifying every record, we use OpenAI to score and rank contractors based on:
- Trade match (exact vs. adjacent trades)
- Geographic proximity (same city > same state)
- License status (active preferred)
- Business name relevance

This reduces verification costs by 95%+ while maintaining quality.

### Stage 3: Email Verification
Selected records are verified via Hunter.io.

```typescript
// lib/hunter-verification.ts
findEmail({
  fullName: 'John Smith',
  company: 'Smith HVAC LLC',
  domain: 'smithhvac.com'
})
```

**Theory**: Hunter.io's Email Finder API provides confidence scores. We only accept emails with 70%+ confidence to minimize bounce rates. Each API call costs credits, so we batch and limit verification to AI-selected records only.

### Stage 4: Move to Cold Leads
Verified records are moved to dispatch-ready table.

```
/api/leads/move-to-cold
```

**Theory**: Separating verified leads into `cold_leads` creates a clean pool for dispatch. The `license_records` table retains history (which records were selected, which failed verification) for analysis and retry logic.

### Stage 5: Dispatch
Job dispatch pulls from both warm technicians and cold leads.

```
/api/jobs/[id]/dispatch
```

**Theory**: Dual-channel dispatch maximizes coverage:
- **Warm (SendGrid)**: Registered technicians get immediate transactional email
- **Cold (Instantly)**: License database leads get drip campaign sequences

---

## API Structure

### Jobs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jobs/create` | POST | Create job from parsed data |
| `/api/jobs/[id]/dispatch` | POST | Dispatch job to technicians |
| `/api/jobs/[id]/technicians` | GET | Get matched technicians |
| `/api/jobs/list` | GET | List all jobs |

### Leads
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/leads/import/florida` | POST | Import FL DBPR data |
| `/api/leads/import/california` | POST | Import CA CSLB data |
| `/api/leads/select` | POST | AI-select contractors for job |
| `/api/leads/verify` | POST | Verify emails via Hunter.io |
| `/api/leads/move-to-cold` | POST | Move verified to cold_leads |

### Outreach
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/outreach/enrich-batch` | GET | Get enrichment stats |
| `/api/instantly/dispatch-leads` | POST | Send to Instantly campaign |
| `/api/instantly/validate-campaign` | POST | Validate campaign exists |

### Work Orders
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/work-orders/parse` | POST | AI-parse raw text to job |
| `/api/work-orders/match` | POST | Match technicians to WO |
| `/api/work-orders/check-duplicate` | POST | Check for duplicate jobs |

---

## External Integrations

### Hunter.io (Email Verification)
- **Purpose**: Find and verify contractor emails
- **API Used**: Email Finder, Email Verifier, Account Info
- **Cost**: Credits per lookup (~$0.03/email)
- **Threshold**: 70% confidence minimum

### Instantly (Cold Outreach)
- **Purpose**: Drip email campaigns to cold leads
- **Campaigns**: Separate by trade (HVAC, Plumbing, Electrical)
- **Features**: Auto-warmup, deliverability optimization

### SendGrid (Transactional Email)
- **Purpose**: Warm technician notifications
- **Templates**: Job alerts, confirmations
- **Features**: Tracking, analytics

### Google Maps (Geocoding)
- **Purpose**: Address → coordinates conversion
- **API Used**: Geocoding API, Distance Matrix
- **Fallback**: Nominatim (OpenStreetMap)

### OpenAI (AI Processing)
- **Purpose**: Work order parsing, contractor selection
- **Model**: GPT-4
- **Features**: Natural language → structured data

---

## Technical Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14, React 18 | App Router, SSR |
| **Styling** | Tailwind, Framer Motion | Animations, glassmorphic UI |
| **Database** | Supabase (PostgreSQL) | Data storage, RLS |
| **Auth** | Supabase Auth | Google OAuth, Email |
| **Maps** | Maplibre GL | Interactive maps |
| **AI** | OpenAI GPT-4 | Parsing, selection |
| **Email** | SendGrid, Instantly | Warm/cold dispatch |
| **Verification** | Hunter.io | Email discovery |
| **Hosting** | Vercel | Edge deployment |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Maps
NEXT_PUBLIC_MAPTILER_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_SERVER_KEY=

# Email Services
SENDGRID_API_KEY=
INSTANTLY_API_KEY=
INSTANTLY_CAMPAIGN_ID_HVAC=
INSTANTLY_CAMPAIGN_ID_PLUMBING=
INSTANTLY_CAMPAIGN_ID_ELECTRICAL=

# Verification
HUNTER_API_KEY=

# AI
OPENAI_API_KEY=
```

---

## Quick Start

```bash
# Install
npm install

# Configure
cp .env.local.example .env.local
# Edit with your API keys

# Run
npm run dev

# Build
npm run build
```

---

## Data Flow Summary

```
1. IMPORT      State license CSV → license_records
2. SELECT      AI scores/ranks contractors for job
3. VERIFY      Hunter.io finds/verifies emails
4. STAGE       Verified records → cold_leads
5. DISPATCH    Job triggers email to warm + cold
6. TRACK       Opens/clicks/replies recorded
```

---

## Admin Interface

**`/admin/outreach`** - Lead management dashboard
- View staging table (license_records)
- Filter by trade, state, email status
- Verify emails in bulk
- Move to cold leads
- Pagination controls

**`/admin/activity`** - Dispatch analytics
- Email open rates
- Reply tracking
- Campaign performance

---

## License

Proprietary - Raven Search

---

Built with Claude Code
