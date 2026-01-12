> Archived on 2026-01-12 from RAVEN_SEARCH_2.0_DOCUMENTATION.md. Reason: Review needed - may contain active documentation

# 🚀 Raven Search 2.0 - Complete Platform Documentation

**Version**: 2.0
**Date**: October 30, 2025
**Status**: ✅ Production Ready with Advanced UI
**Build Status**: ✅ Passing (31 routes compiled)

---

## 📋 Table of Contents

1. [What's New in 2.0](#whats-new-in-20)
2. [System Architecture](#system-architecture)
3. [Dispatch Loader 2.0](#dispatch-loader-20)
4. [UI/UX Improvements](#uiux-improvements)
5. [Technical Stack](#technical-stack)
6. [Feature Breakdown](#feature-breakdown)
7. [Setup & Deployment](#setup--deployment)
8. [API Documentation](#api-documentation)
9. [Database Schema](#database-schema)
10. [Best Practices](#best-practices)

---

## 🎯 What's New in 2.0

### Major Enhancements

#### 1. **Glassmorphic Dispatch Loader** 🎨
Complete redesign of the dispatch experience with modern, polished UI:
- **915×800px glassmorphic modal** with blur effects
- **Interactive Maplibre GL map** showing job location and technician markers
- **Expandable text container** (120px collapsed / 240px expanded)
- **Real-time dispatch progress tracker** with white text on glassmorphic container
- **Map controls**: Expand/collapse, zoom in/out
- **Custom purple styling** for roads and buildings
- **Street name labels** at zoom 15+ (white Inter font)
- **45px padding** from all modal edges for consistent spacing
- **25px gaps** between containers

#### 2. **Enhanced User Experience** 🌟
- **Complete user settings page** with profile, password, notifications, and security
- **Keyboard navigation** - ESC to close overlays
- **Professional empty states** across all pages
- **Toast notification system** for success/error feedback
- **Form validation** with real-time feedback
- **Confirmation modals** replacing browser dialogs

#### 3. **Advanced Work Order System** 📋
- **AI-powered parsing** with OpenAI GPT-4
- **Natural language processing** for unstructured work orders
- **Automatic geocoding** and technician matching
- **Create job form as overlay** - slides from bottom, positioned 200px right
- **Typing animation** for work order text display

#### 4. **Interactive Mapping** 🗺️
- **Maplibre GL integration** with custom styling
- **Job location markers** (cream circle with purple border)
- **Technician markers** (numbered blue circles)
- **Geocoding support** via OpenStreetMap Nominatim
- **Expandable map view** (400×267px → 600×400px)
- **Custom purple roads/buildings** (#7b78aa - 20% lower luminosity)

---

## 🏗️ System Architecture

### Single-Page Overlay Architecture ⭐

**🎯 Core Concept**: This platform uses an **overlay-first navigation system** instead of traditional page routing.

#### Navigation Paradigm
**Traditional Apps**: Click → Navigate to new page → Lose context
**Raven Search**: Click → Overlay slides over map → Context maintained ✨

#### How Navigation Works
1. **Persistent Background** - Home page (/) with interactive map stays loaded
2. **Sidebar Clicks** - Trigger overlay state changes (NOT route navigation)
3. **Overlays Appear** - Floating cards slide over the map with animations
4. **Close Overlays** - Press ESC or click X to return to map view

#### Overlay-Based Sections (State-Managed)
These render as **floating overlays** over the persistent map background:
- **Jobs List** (`JobsOverlay.tsx`) - 615×772px, search/filter/pagination
- **Compliance** (`ComplianceOverlay.tsx`) - Policy management with backdrop blur
- **Compliance Quick** (`ComplianceQuickOverlay.tsx`) - Simplified 2-toggle view
- **Create Job** (`CreateJobForm.tsx`) - AI-powered form, slides from bottom
- **Dispatch Loader** - 915×800px glassmorphic modal with live map

#### Traditional Routes (Page Navigation)
These use standard Next.js routing:
- **Technicians** - `/technicians`, `/technicians/[id]`
- **Admin** - `/admin/activity`, `/admin/settings`, `/admin/outreach`
- **Auth** - `/login`, `/signup`
- **Settings** - `/settings`
- **Job Details** - `/jobs/[id]` (may become overlay in future)

#### State Management
```typescript
// app/page.tsx
const [activeOverlay, setActiveOverlay] = useState<
  'none' | 'jobs' | 'compliance' | 'compliance-quick' | 'create-job'
>('none');
```

#### Visual Flow Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    Hero Background (/)                       │
│              🗺️ PERSISTENT MAP - ALWAYS VISIBLE             │
│  ┌──────────────┐    ┌──────────────┐   ┌──────────────┐  │
│  │   Sidebar    │    │  Search Bar  │   │  Auth Buttons│  │
│  │              │    │    615×183   │   │              │  │
│  │  🔘 Jobs     │    │  Glassmorphic│   │  Sign In/Up  │  │
│  │  🔘 Comply   │    │  Click = Form│   │              │  │
│  └──────────────┘    └──────────────┘   └──────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Background Map (Florida/Miami)              │  │
│  │          Parallax, job markers, tech pins            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
    Click Sidebar Icon ↓      Type in Search ↓     Dispatch Job ↓
    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
    │ Jobs List   │         │ Create Job  │         │  Dispatch   │
    │ OVERLAY     │         │ OVERLAY     │         │  Loader     │
    │ (Floating)  │         │ (Slides in) │         │  OVERLAY    │
    └─────────────┘         └─────────────┘         └─────────────┘
         Press ESC ↑              Press ESC ↑             Close ↑
            (Returns to map background)
```

#### Why This Architecture?
- ✨ **Context Preservation** - Map and job locations always visible
- ⚡ **Performance** - No page reloads, instant transitions
- 🎨 **Visual Continuity** - Cohesive single-page experience
- 🧠 **Mental Model** - Users stay oriented in one "space"
- 🎭 **Glassmorphic Design** - Overlays with blur effects showcase map beneath

### Dispatch Loader 2.0 Architecture

```
┌───────────────────────────────────────────────────────────────┐
│              Glassmorphic Modal (915×800px)                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [X]                                         Close Button│ │
│  │                                                          │ │
│  │  WO-2025-001 (32px Futura Bold, white)                 │ │
│  │                                                          │ │
│  │  ┌──────────────────────┐  ┌──────────────────────┐   │ │
│  │  │  Work Order Text     │  │ Dispatch Progress    │   │ │
│  │  │  (400×120/240px)     │  │ (400×240px)          │   │ │
│  │  │  ┌────────────────┐  │  │                      │   │ │
│  │  │  │ Title (Bold 14)│  │  │ ✓ Work order Created│   │ │
│  │  │  │ Body (Reg 12)  │  │  │ 🔍 Searching...     │   │ │
│  │  │  │ Typing anim... │  │  │ 👥 45 Reached       │   │ │
│  │  │  └────────────────┘  │  │ ⏰ Waiting          │   │ │
│  │  │  [v] Expand/Collapse│  │ 💬 2 Answered       │   │ │
│  │  └──────────────────────┘  └──────────────────────┘   │ │
│  │             25px gap                                    │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │            Maplibre Map (400×267px)              │ │ │
│  │  │  ┌────────┐                              [+][-] │ │ │
│  │  │  │ Job Pin│  Technician Pins              ⬆️    │ │ │
│  │  │  │   ●    │    ①  ②  ③  ④                      │ │ │
│  │  │  └────────┘                              [⤢]    │ │ │
│  │  │  Purple roads/buildings, white labels    ⬇️    │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                     45px padding all sides                    │
└───────────────────────────────────────────────────────────────┘
```

---

## 🎨 Dispatch Loader 2.0

### Design Specifications

#### Modal Container
- **Dimensions**: 915×800px (fixed height, no animation)
- **Background**: `rgba(47, 47, 47, 0.3)` with `backdrop-filter: blur(12px)`
- **Border**: `1px solid rgba(154, 150, 213, 0.3)`
- **Border Radius**: 16px
- **Box Shadow**: `0px 0px 22.9px rgba(0, 0, 0, 0.21)`
- **Padding**: 40px
- **Position**: Centered on screen

#### Work Order Number
- **Position**: Top-left, 45px from edges
- **Font**: Futura Bold, 32px
- **Color**: White (#FFFFFF)
- **Hover**: Color changes to #CDCDE5
- **Behavior**: Clickable, navigates to job detail page

#### Text Container
- **Dimensions**: 400×240px (expanded) / 400×120px (collapsed)
- **Position**: 45px from left, 102px from top (45+32+25)
- **Background**: `rgba(178, 173, 201, 0.05)`
- **Border**: `1px solid rgba(249, 243, 229, 0.11)`
- **Border Radius**: 8px
- **Content**:
  - **Title**: Inter Bold, 14px, white
  - **Body**: Inter Regular, 12px, white
  - **Typing Animation**: Word-by-word reveal, 50ms per word
  - **Chevron Button**: Top-right, rotates 180° when expanded

#### Dispatch Progress Container
- **Dimensions**: 400×240px
- **Position**: 45px + 400px + 25px from left (470px)
- **Same styling as text container**
- **Title**: "Dispatch Progress" - Futura Medium, 16px, white
- **Progress Items**:
  - Roboto Mono, 10px, white
  - Icons: 18×18px, color #6D699E
  - Connecting lines: 2px wide, #BAB3C4
  - Dots: 8×8px circles

#### Map Container
- **Dimensions**: 400×267px (normal) / 600×400px (expanded)
- **Position**: Below text container, 25px gap
- **Background**: `rgba(178, 173, 201, 0.05)` (matching text container)
- **Border**: `1px solid rgba(249, 243, 229, 0.11)`
- **Border Radius**: 8px
- **Transition**: Width/height animate over 300ms

#### Map Styling
- **Base Layer**: `rgba(178, 173, 201, 0.05)`
- **Roads**: `#7b78aa` (purple, 20% lower luminosity)
- **Buildings**: `#7b78aa` with 60% opacity
- **Street Labels** (zoom 15+):
  - Font: Inter Regular, 12px
  - Color: White (#FFFFFF)
  - Halo: `rgba(47, 47, 47, 0.8)` with 1.5px width
- **Job Marker**: Cream circle (#F9F3E5) with purple border
- **Technician Markers**: Blue circles (#6C72C9) with numbers

#### Map Controls
- **Zoom Buttons** (top-right):
  - Position: 12px from top/right of map
  - Size: 32×32px each
  - Background: `rgba(178, 173, 201, 0.05)`
  - Border: `1px solid rgba(249, 243, 229, 0.11)`
  - Gap: 8px between buttons

- **Expand Button** (bottom-right):
  - Position: 12px from bottom/right of map
  - Size: 32×32px
  - Icon changes based on state
  - Triggers map resize + calls `map.resize()`

#### Close Button
- **Position**: Top-right, 20px from edges
- **Size**: 32×32px
- **Icon**: X symbol, #B4B4C4
- **Hover**: Scale 1.1
- **Behavior**: Closes modal, resets all state

### Typography System

```css
/* Work Order Number */
font-family: 'Futura', sans-serif;
font-weight: 700;
font-size: 32px;
color: #FFFFFF;

/* Text Container - Title */
font-family: 'Inter', sans-serif;
font-weight: 700;
font-size: 14px;
color: #FFFFFF;

/* Text Container - Body */
font-family: 'Inter', sans-serif;
font-weight: 400;
font-size: 12px;
color: #FFFFFF;
line-height: 1.328125em;

/* Dispatch Progress Title */
font-family: 'Futura', sans-serif;
font-weight: 500;
font-size: 16px;
color: #FFFFFF;

/* Dispatch Progress Items */
font-family: 'Roboto Mono', monospace;
font-weight: 400/500;
font-size: 10px;
color: #FFFFFF;
line-height: 1.31884765625em;

/* Map Street Labels */
font-family: 'Inter', sans-serif;
font-weight: 400;
font-size: 12px;
color: #FFFFFF;
```

### Color Palette

```css
/* Glassmorphic Surfaces */
--modal-bg: rgba(47, 47, 47, 0.3);
--container-bg: rgba(178, 173, 201, 0.05);
--container-border: rgba(249, 243, 229, 0.11);

/* Text Colors */
--text-white: #FFFFFF;
--text-gray: #B4B4C4;
--text-purple: #9392AF;

/* Purple Accent */
--purple-base: #9a96d5;
--purple-dark: #7b78aa;
--purple-border: rgba(154, 150, 213, 0.3);

/* Map Colors */
--job-pin: #F9F3E5;
--tech-pin: #6C72C9;
--roads: #7b78aa;

/* Interactive States */
--hover-bg: rgba(178, 173, 201, 0.15);
--hover-border: rgba(249, 243, 229, 0.3);
```

### Animation Specifications

#### Modal Entry
```javascript
initial: {
  width: 800,
  height: 200,
  x: searchBoxPos.x - window.innerWidth / 2,
  y: searchBoxPos.y - window.innerHeight / 2,
  opacity: 0.8,
  scale: 0.95
}
animate: {
  width: 915,
  height: 800,
  x: 0,
  y: 0,
  opacity: 1,
  scale: 1
}
transition: {
  duration: 1,
  ease: [0.22, 1, 0.36, 1]
}
```

#### Typing Animation
- **Speed**: 50ms per word
- **Cursor**: 2px wide, #BAB3C4, blinks at 1s intervals
- **Implementation**: Split text by spaces, reveal word-by-word

#### Dispatch Progress
- **Line Growth**: 300ms, easeInOut
- **Dot Appear**: 200ms after line, scale from 0 to 1
- **Text Fade**: 300ms, opacity 0 to 1
- **Icon Animations**:
  - Searching: Rotate 360° continuously
  - Reached: Pulse scale 1 to 1.1
  - Waiting: Clock hands rotate
  - Answered: Bounce up/down

#### Map Expand
- **Duration**: 300ms
- **Easing**: ease-in-out
- **Properties**: width, height
- **Callback**: `setTimeout(() => map.resize(), 300)`

---

## 🎯 UI/UX Improvements

### Completed in 2.0

#### 1. User Settings Page
- **Profile Management**: Edit name, view email/ID
- **Password Change**: Secure update with validation (8+ chars)
- **Organization Info**: View name and role
- **Notification Preferences**: Email, dispatch, reports toggles
- **Security**: Sign out all devices
- **Danger Zone**: Account deletion with warning

#### 2. Enhanced Interactions
- **Keyboard Navigation**: ESC closes overlays
- **Button Functionality**: All buttons now have proper handlers
- **Form Validation**: Real-time feedback on inputs
- **Confirmation Modals**: Replace browser `confirm()`

#### 3. Professional Polish
- **Empty States**: Helpful messages with CTAs
- **Loading States**: Spinners and skeleton screens
- **Toast Notifications**: Global success/error system
- **Error Handling**: User-friendly error messages

### Design System

#### Spacing Scale
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 40px;
--space-3xl: 45px;
```

#### Shadow System
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
--shadow-dispatch: 0px 0px 22.9px rgba(0, 0, 0, 0.21);
```

#### Transitions
```css
--transition-fast: 150ms ease-in-out;
--transition-base: 300ms ease-in-out;
--transition-slow: 500ms ease-in-out;
--transition-dispatch: 1s cubic-bezier(0.22, 1, 0.36, 1);
```

---

## 🛠️ Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **React**: 18.3
- **TypeScript**: 5.x
- **Animation**:
  - Framer Motion (modals, overlays)
  - @react-spring/web (micro-interactions)
- **Maps**:
  - Maplibre GL JS
  - Google Maps API (geocoding, directions)
- **Styling**: Custom CSS with CSS Modules

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email, OAuth)
- **Edge Functions**: Supabase Functions (Deno)
- **File Storage**: Supabase Storage

### AI & APIs
- **AI**: OpenAI GPT-4 (work order parsing)
- **Email**:
  - SendGrid (transactional, warm leads)
  - Instantly (cold outreach)
- **Maps**:
  - Google Maps API
  - OpenStreetMap Nominatim (geocoding)
  - MapTiler/OpenMapTiles (vector tiles)

### Development Tools
- **Build**: Next.js compiler (Turbopack)
- **Linting**: ESLint
- **Type Checking**: TypeScript compiler
- **Version Control**: Git

---

## 📦 Feature Breakdown

### 1. Work Order Management

#### AI-Powered Parsing
```typescript
// Input: Natural language
"Need plumber for leak at 123 Main St Miami.
Call John 555-1234. Budget $200. Urgent!"

// Output: Structured data
{
  trade_needed: "Plumbing",
  address_text: "123 Main St, Miami",
  contact_name: "John",
  contact_phone: "555-1234",
  budget_min: 150,
  budget_max: 250,
  urgency: "urgent",
  lat: 25.7617,
  lng: -80.1918
}
```

**Implementation**: `/app/api/work-orders/parse/route.ts`
- GPT-4 prompt engineering
- Geocoding via Google Maps
- Validation and normalization
- Error handling for incomplete data

#### Create Job Form
- **Type**: Overlay modal
- **Trigger**: Click search bar or submit search
- **Animation**: Slides from bottom (y: 100vh → y: 60)
- **Position**: 200px right from center
- **Features**:
  - Real-time AI parsing
  - Field-by-field validation
  - Geocoding on address entry
  - Trade dropdown with defaults
  - Budget range inputs
  - Schedule picker
  - Success callback → dispatch loader

### 2. Dispatch System

#### Hybrid Email Routing
```typescript
// Warm leads (signed_up = true)
→ SendGrid template
→ Immediate delivery
→ Transactional tracking

// Cold leads (signed_up = false)
→ Instantly campaign
→ Scheduled delivery
→ Cold outreach tracking
```

**Implementation**: `/supabase/functions/dispatch-work-order/index.ts`
- Query technicians by location + trade
- Calculate distance (Haversine formula)
- Filter by compliance requirements
- Route by `signed_up` status
- Track in `work_order_outreach` table

#### Visual Dispatch Flow
1. **Created**: Work order saved → Green checkmark
2. **Searching**: Algorithm running → Rotating magnifier
3. **Reached**: Emails sent → Pulsing people icon
4. **Waiting**: Awaiting responses → Spinning clock
5. **Answered**: Responses received → Bouncing message

### 3. Technician Matching

#### Algorithm
```typescript
// 1. Geographic filtering
const nearbyTechs = technicians.filter(tech => {
  const distance = haversineDistance(
    { lat: job.lat, lng: job.lng },
    { lat: tech.lat, lng: tech.lng }
  );
  return distance <= MAX_DISTANCE_MILES;
});

// 2. Skill matching
const matchingTechs = nearbyTechs.filter(tech =>
  tech.trades.includes(job.trade_needed)
);

// 3. Compliance validation
const validTechs = matchingTechs.filter(tech =>
  validateCompliance(tech, job.compliance_requirements)
);

// 4. Sorting (distance, rating, response rate)
const sorted = validTechs.sort((a, b) =>
  a.distance - b.distance || b.rating - a.rating
);
```

**Compliance Checks**:
- General liability insurance ($1M+)
- Auto insurance ($500K+)
- Workers comp (if required)
- Trade-specific licenses
- Background checks (if required)

### 4. Real-Time Tracking

#### SLA Timers
- **Start**: When work order is dispatched
- **Tracking**: Automatic interval checks
- **Display**: Human-readable countdown
- **Actions**: Auto-escalation on timeout

#### Email Open Tracking
```typescript
// Edge Function: /supabase/functions/track-email-open/index.ts
export default async (req: Request) => {
  const { id } = await req.json();

  await supabase
    .from('work_order_outreach')
    .update({ opened_at: new Date().toISOString() })
    .eq('id', id);

  return new Response('OK');
};
```

**Implementation**:
- 1×1 transparent pixel in email
- Unique ID per recipient
- Tracks first open timestamp
- Updates dashboard in real-time

---

## 🗄️ Database Schema

### Core Tables

#### `jobs`
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  created_by UUID REFERENCES auth.users(id),
  job_title TEXT NOT NULL,
  description TEXT,
  raw_text TEXT, -- Original unstructured input
  address_text TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  trade_needed TEXT,
  budget_min DECIMAL(10, 2),
  budget_max DECIMAL(10, 2),
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'draft',
  scheduled_start_ts TIMESTAMP WITH TIME ZONE,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_jobs_org_status ON jobs(organization_id, status);
CREATE INDEX idx_jobs_location ON jobs USING GIST(ll_to_earth(lat, lng));
CREATE INDEX idx_jobs_trade ON jobs(trade_needed);
```

#### `technicians`
```sql
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  signed_up BOOLEAN DEFAULT FALSE,
  address_text TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  trades TEXT[], -- Array of trade names
  rating DECIMAL(3, 2) DEFAULT 0,
  total_jobs_completed INTEGER DEFAULT 0,
  response_rate DECIMAL(5, 2) DEFAULT 0,

  -- Compliance
  gl_policy_number TEXT,
  gl_expiry_date DATE,
  gl_coverage_amount DECIMAL(15, 2),
  auto_policy_number TEXT,
  auto_expiry_date DATE,
  workers_comp_policy_number TEXT,
  workers_comp_expiry_date DATE,
  background_check_date DATE,
  background_check_status TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_techs_org ON technicians(organization_id);
CREATE INDEX idx_techs_location ON technicians USING GIST(ll_to_earth(lat, lng));
CREATE INDEX idx_techs_trades ON technicians USING GIN(trades);
CREATE INDEX idx_techs_signed_up ON technicians(signed_up);
```

#### `work_order_outreach`
```sql
CREATE TABLE work_order_outreach (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id),
  dispatch_method TEXT CHECK (dispatch_method IN ('sendgrid', 'instantly')),
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_opened_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  response_type TEXT CHECK (response_type IN ('interested', 'not_interested', 'no_response')),
  sendgrid_message_id TEXT,
  instantly_campaign_id TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_outreach_job ON work_order_outreach(job_id);
CREATE INDEX idx_outreach_tech ON work_order_outreach(technician_id);
CREATE INDEX idx_outreach_method ON work_order_outreach(dispatch_method);
```

#### `compliance_policies`
```sql
CREATE TABLE compliance_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  policy_name TEXT NOT NULL,
  trade_specific TEXT,

  -- Insurance Requirements
  gl_required BOOLEAN DEFAULT TRUE,
  gl_min_amount DECIMAL(15, 2) DEFAULT 1000000,
  auto_required BOOLEAN DEFAULT TRUE,
  auto_min_amount DECIMAL(15, 2) DEFAULT 500000,
  workers_comp_required BOOLEAN DEFAULT FALSE,

  -- Certifications
  background_check_required BOOLEAN DEFAULT FALSE,
  license_required BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Migrations

All migrations located in `/supabase/migrations/`:
```
20250101000000_initial_schema.sql
20250102000000_add_compliance.sql
20250103000000_add_admin_users.sql
20251029000000_add_raw_text_to_jobs.sql
```

**Run migrations**:
```bash
# Local
supabase db push

# Production
supabase link --project-ref <your-project>
supabase db push
```

---

## 🚀 Setup & Deployment

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key
- SendGrid account
- (Optional) Instantly account
- (Optional) Google Maps API key

### Local Development

#### 1. Clone and Install
```bash
git clone <your-repo>
cd raven-claude
npm install
```

#### 2. Environment Variables
Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# SendGrid
SENDGRID_API_KEY=SG....
SENDGRID_TEMPLATE_ID_WORK_ORDER=d-...
SENDGRID_FROM_EMAIL=dispatch@yourdomain.com
SENDGRID_FROM_NAME=Raven Dispatch

# Instantly (Optional)
INSTANTLY_API_KEY=...
INSTANTLY_CAMPAIGN_ID_HVAC=...
INSTANTLY_CAMPAIGN_ID_PLUMBING=...
INSTANTLY_CAMPAIGN_ID_ELECTRICAL=...

# Google Maps (Optional but recommended)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

#### 3. Database Setup
```bash
# Run migrations
supabase db push

# Grant yourself admin access
# In Supabase SQL Editor:
INSERT INTO admin_users (user_id, email, granted_by)
VALUES (
  'your-user-id',  -- Get from auth.users table
  'your@email.com',
  'system'
);
```

#### 4. Deploy Edge Functions
```bash
supabase functions deploy dispatch-work-order
supabase functions deploy track-email-open
```

#### 5. Start Development Server
```bash
npm run dev
# Visit http://localhost:3000
```

### Production Deployment

#### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Deploy to production
vercel --prod
```

#### Option 2: Docker
```bash
# Build
docker build -t raven-search .

# Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  raven-search
```

#### Post-Deployment Checklist
- [ ] Run database migrations on production
- [ ] Deploy Edge Functions
- [ ] Set all environment variables
- [ ] Grant admin access to your account
- [ ] Configure SendGrid domain authentication
- [ ] Test work order creation end-to-end
- [ ] Verify email dispatch works
- [ ] Check dispatch loader animations
- [ ] Test map functionality

---

## 📚 API Documentation

### Work Order Parsing

**Endpoint**: `POST /api/work-orders/parse`

**Request**:
```json
{
  "rawText": "Need HVAC tech at 123 Main St, Miami FL. AC not cooling. Budget $500. Contact John at 555-1234."
}
```

**Response**:
```json
{
  "parsed": {
    "job_title": "AC not cooling",
    "description": "Need HVAC tech. AC not cooling.",
    "trade_needed": "HVAC",
    "address_text": "123 Main St, Miami FL",
    "lat": 25.7617,
    "lng": -80.1918,
    "budget_min": 400,
    "budget_max": 600,
    "contact_name": "John",
    "contact_phone": "555-1234",
    "urgency": "medium"
  },
  "confidence": 0.92
}
```

### Google Maps Directions

**Endpoint**: `GET /api/maps/directions`

**Query Params**:
- `origin`: lat,lng (e.g., "25.7617,-80.1918")
- `destination`: lat,lng

**Response**:
```json
{
  "success": true,
  "polyline": "encoded_polyline_string",
  "distance": {
    "text": "5.2 mi",
    "value": 8369
  },
  "duration": {
    "text": "12 mins",
    "value": 720
  }
}
```

---

## 🎯 Best Practices

### Code Organization
```
/app
  /page.tsx              # Home with overlays
  /(auth)                # Auth pages (login, signup)
  /jobs                  # Job management
  /technicians           # Technician management
  /admin                 # Admin dashboard
  /api                   # API routes
    /work-orders/parse   # AI parsing
    /maps/directions     # Directions API

/components
  /JobsOverlay.tsx       # Jobs floating card
  /ComplianceOverlay.tsx # Compliance card
  /CreateJobForm.tsx     # Job creation form
  /Sidebar.tsx           # Navigation
  /Toast.tsx             # Notifications
  /ConfirmModal.tsx      # Confirmation dialogs
  /EmptyState.tsx        # Empty state displays

/supabase
  /migrations            # Database migrations
  /functions             # Edge Functions
```

### State Management
- **Global State**: React Context for auth, overlays
- **Server State**: Supabase queries
- **Local State**: useState for UI components
- **URL State**: useSearchParams for filters

### Performance Optimization
- **Code Splitting**: Dynamic imports for heavy components
- **Image Optimization**: Next.js Image component
- **Database**: Indexed queries, pagination
- **Caching**: Supabase query caching
- **Bundle Size**: Tree-shaking, minimal dependencies

### Security
- **Row Level Security**: Enabled on all Supabase tables
- **API Routes**: Protected with Supabase auth
- **Environment Variables**: Never commit secrets
- **Input Validation**: Zod schemas on all inputs
- **XSS Prevention**: React auto-escaping
- **CORS**: Restricted to production domain

---

## 📊 Metrics & Analytics

### Key Performance Indicators

#### Dispatch Efficiency
- **Time to Dispatch**: Average time from job creation to email sent
- **Match Rate**: % of jobs with ≥5 matching technicians
- **Response Rate**: % of technicians who respond within 24h

#### User Engagement
- **Active Users**: Monthly/daily active users
- **Session Duration**: Average time spent in app
- **Feature Usage**: Most/least used features

#### Business Metrics
- **Jobs Created**: Total jobs per period
- **Completion Rate**: % of jobs completed
- **Technician Growth**: New technicians per period
- **Revenue per Job**: Average revenue

### Logging & Monitoring
- **Supabase Logs**: Database and Edge Function logs
- **Next.js Analytics**: Page views, performance
- **Error Tracking**: Console errors, API failures
- **User Feedback**: In-app feedback widget

---

## 🎉 Version History

### 2.0 (October 30, 2025)
- ✨ Complete dispatch loader redesign with glassmorphism
- 🗺️ Maplibre GL integration with custom styling
- 🎨 Enhanced UI/UX across entire platform
- ⌨️ Keyboard navigation support
- 📝 Complete user settings page
- 🎯 Professional empty states
- 🔔 Toast notification system

### 1.0 (October 29, 2025)
- 🚀 Initial production release
- 🤖 AI-powered work order parsing
- 📧 Hybrid dispatch system
- 👥 Technician matching algorithm
- ✅ Compliance validation
- 📊 Admin dashboard
- 🎭 Single-page overlay architecture

---

## 📞 Support & Resources

### Documentation
- **Main Docs**: This file
- **Dispatch Spec**: `DISPATCH_LOADER_2.0_SPECIFICATION.md`
- **UI Audit**: `UI_UX_AUDIT_AND_IMPROVEMENTS.md`
- **Setup Guide**: `QUICK_FINISH_SETUP.md`
- **Architecture**: `ARCHITECTURE_PLAN.md`

### External Resources
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Framer Motion**: https://www.framer.com/motion
- **Maplibre GL**: https://maplibre.org/

### Common Issues
1. **Map not loading**: Check Maplibre GL CSS is imported
2. **Markers not showing**: Verify coordinates are valid
3. **Dispatch not working**: Check Edge Functions are deployed
4. **Auth issues**: Verify Supabase keys in env vars

---

**Built with ❤️ using Claude Code** 🤖
**Ready for production deployment!** 🚀

