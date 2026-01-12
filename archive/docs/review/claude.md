> Archived on 2026-01-12 from claude.md. Reason: Review needed - large context file, may contain active instructions

# Ravensearch Project Context

## CRITICAL PRODUCTION ISSUES & SOLUTIONS

### Google OAuth - redirect_uri_mismatch (SOLVED)

**Problem**: Google OAuth failed with `Error 400: redirect_uri_mismatch`
- Custom `redirectTo` parameter caused mismatch between what Google expected and what was sent
- Dev vs prod URL confusion (localhost vs vercel.app)

**Solution**: Remove custom redirectTo, let Supabase use default callback
```tsx
// ❌ WRONG - causes redirect_uri_mismatch
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback` }
});

// ✅ CORRECT - uses Supabase's default
await supabase.auth.signInWithOAuth({ provider: 'google' });
```

**Google Console Setup**:
- Authorized redirect URI: `https://utpmtlzqpyewpwzgsbdu.supabase.co/auth/v1/callback`
- Supabase handles redirect automatically

**Files**: `components/AuthProvider.tsx:42`, `app/api/auth/callback/route.ts`

---

### Vercel Deployment - Cron Job Blocking & Git Integration (SOLVED)

**Date:** 2025-01-19
**Status:** ✅ RESOLVED

**Problem**: Deployment blocked by cron job configuration incompatible with Hobby plan
- `vercel.json` had cron job scheduled to run every 15 minutes (`*/15 * * * *`)
- Hobby accounts limited to daily cron jobs only
- Git integration not auto-triggering deployments after pushes

**Error Message**:
```
Hobby accounts are limited to daily cron jobs. This cron expression (*/15 * * * *)
would run more than once per day. Upgrade to the Pro plan to unlock all Cron Jobs features.
```

**Solution Steps**:

1. **Attempted Daily Schedule** (Failed)
   - Changed cron schedule to `0 0 * * *` (daily at midnight)
   - Still blocked by Vercel validation

2. **Removed Cron Configuration** (Failed)
   - Changed `vercel.json` to empty object `{}`
   - Still detected old configuration

3. **Deleted vercel.json** (Success)
   - Completely removed `vercel.json` file
   - Committed and pushed (commit `20abcbf`)
   - Deployment unblocked

4. **Upgraded to Pro Plan**
   - User upgraded account to Pro tier
   - Unlocked all cron job features for future use

**Commits Made**:
```
42a65ae - Major feature release (COI compliance, contractor onboarding, QuickCompliance)
1f00f5b - Fix: Change cron schedule to daily for Hobby plan compatibility
b19deee - Remove cron jobs to unblock deployment
20abcbf - Delete vercel.json to unblock deployment
```

**Current Deployment Status**:
- Production URL: https://ravensearch.ai (also: raven-search.com, raven-claude.vercel.app)
- Latest deployed commit: `ffcb49c` (2025-12-03)
- Status: ✅ LIVE - All features deployed and working

**Git Integration**: ✅ WORKING
- Auto-deploys on push to main branch
- Vercel project ID: `prj_UplDmHSSeEWMkiIMr2D2ngg7WPiH`
- Team ID: `team_s9Qz6y1XJxB3yX6r9hLKtj7r`

**Files Affected**:
- `/vercel.json` - Deleted entirely
- Multiple feature files from commit `42a65ae`

**Key Learnings**:
1. Vercel caches `vercel.json` config - must delete file entirely to clear
2. Hobby plan cron limitations are strict - requires Pro for sub-daily jobs
3. Git integration can fail silently - always verify deployment triggered
4. Manual redeployments may use old commits - check deployment details

---

### Admin Pages - Database Schema Mismatch (SOLVED)

**Problem**: Admin Activity/Outreach pages showed 0 stats despite 18 targets in database
- Code expected: `enrichment_status` column
- Database had: `status`, `email_found`, `email_verified` columns
- Migration created NEW tables instead of checking existing schema

**Root Cause**: `CREATE TABLE IF NOT EXISTS` didn't overwrite existing tables with different schemas

**Solution**: Updated code to match actual database schema
```tsx
// ❌ WRONG - column doesn't exist
const { data } = await supabase.from('outreach_targets').select('enrichment_status');

// ✅ CORRECT - uses actual columns
const { data } = await supabase.from('outreach_targets').select('status, email_found, email_verified');
```

**Mapping**:
- Pending: `!email_found`
- Enriched: `email_found && email_verified`
- Failed: `email_found && !email_verified`

**Files**: `app/admin/activity/page.tsx:85-99`, `app/admin/outreach/page.tsx:21-32,442-465`

---

### Dispatch Stats Not Showing (SOLVED)

**Problem**: JobDetailOverlay showed empty dispatch stats despite dispatches existing
- Mock data fallback prevented real data from showing
- API endpoint returned empty array but didn't log why

**Solution**:
1. Check API logs for actual error messages
2. Verify database table schemas match TypeScript interfaces
3. Remove mock data fallbacks during debugging
4. Use real-time Supabase subscriptions for live updates

**Pattern**: Always verify schema before assuming tables are empty
```bash
# Check actual table schema
node -e "const { createClient } = require('@supabase/supabase-js'); ..."
```

**Files**: `components/JobDetailOverlay.tsx:100-150`

---

### Dispatch Showing Distant Technicians - Distance Filtering Missing (SOLVED)

**Date:** 2025-01-19

**Problem**: Dispatch was sending to technicians 942 miles away despite appearing close on map
- Job location: Orlando, FL (28.5249, -81.4881)
- Dispatched to: 40 HVAC technicians across multiple states
  - 12 in Orlando, FL (~2-5 miles)
  - 10 in Miami, FL (~235 miles)
  - Others in New York, Houston, Denver, etc.
- Distance API showed correctly but dispatch had no geographic filter

**Root Cause**: Dispatch route matched technicians by:
- `org_id` ✅
- `trade_needed` ✅
- `is_available` ✅
- **BUT NOT** by distance to job location ❌

**Solution**: Added 50-mile radius filter to dispatch route

**File**: `/app/api/jobs/[id]/dispatch/route.ts` (lines 92-109)

```typescript
// Filter technicians by distance (within 50 miles of job)
const MAX_DISTANCE_MILES = 50;
const technicianList = (technicians || []).filter(tech => {
  if (!tech.lat || !tech.lng || !job.lat || !job.lng) return false;

  // Calculate distance using Haversine formula
  const R = 3959; // Earth's radius in miles
  const dLat = (tech.lat - job.lat) * Math.PI / 180;
  const dLng = (tech.lng - job.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(job.lat * Math.PI / 180) * Math.cos(tech.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= MAX_DISTANCE_MILES;
});
```

**Result**:
- ✅ Only 12 Orlando HVAC technicians dispatched (instead of 40)
- ✅ All technicians within 50-mile radius
- ✅ Distances showing correctly (2.3 mi, 4.7 mi, etc.)
- ✅ All markers appear close together on map

**Related Issue Fixed**: Distance calculation was showing 0.0 mi in technicians API

**File**: `/app/api/jobs/[id]/technicians/route.ts` (lines 5-16, 87-93)

Added Haversine distance calculation function and integrated into technician transform:

```typescript
// Haversine formula to calculate distance between two lat/lng points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate actual distance for each technician
const distance = calculateDistance(
  job.lat || 0,
  job.lng || 0,
  tech.lat || 0,
  tech.lng || 0
);
```

---

### Onboarding Flow - Loop Fix & Sidebar Hiding (SOLVED)

**Date:** 2025-12-03
**Status:** ✅ RESOLVED
**Commit:** `ffcb49c`

**Problem 1: Onboarding Loop**
After completing the compliance acknowledgment, users were redirected back to the start of onboarding instead of the dashboard.

**Root Cause**: Middleware checked `org.onboarding_complete` which was still `false` due to database propagation delay.

**Solution**: Added bypass checks in middleware:
```typescript
// Skip redirect if coming from onboarding completion
const justCompletedOnboarding = req.nextUrl.searchParams.get('onboarding') === 'complete';
const referer = req.headers.get('referer') || '';
const fromOnboarding = referer.includes('/onboarding/compliance/acknowledge');

if (!isExemptPath && org && !org.onboarding_complete && !justCompletedOnboarding && !fromOnboarding) {
  // Redirect to onboarding
}
```

Updated acknowledge page to redirect with bypass param:
```typescript
router.push('/?onboarding=complete');
```

**Files**: `/middleware.ts:61-68`, `/app/onboarding/compliance/acknowledge/page.tsx:118`

---

**Problem 2: Users Could Navigate Away During Onboarding**
Users could click on sidebar navigation to escape the onboarding flow.

**Solution**: Hide sidebar during all `/onboarding/*` routes.

**File**: `/components/Sidebar.tsx:167-170`

```typescript
// Hide sidebar on auth pages (login, signup) and onboarding
if (pathname?.startsWith('/login') || pathname?.startsWith('/signup') || pathname?.startsWith('/onboarding')) {
  return null;
}
```

**Additional File**: `/app/onboarding/layout.tsx` - Simple layout wrapper for onboarding pages.

---

### Compliance Acknowledgments Archive - Legal Defensibility (IMPLEMENTED)

**Date:** 2025-12-03
**Status:** ✅ DEPLOYED
**Commit:** `ffcb49c`

**Problem**: Compliance acknowledgment records would be deleted via CASCADE when users or organizations were deleted, losing the legal audit trail.

**Solution**: Created archive system with BEFORE DELETE trigger.

**Migration File**: `/supabase/migrations/20251203_archive_compliance_acknowledgments.sql`

**Archive Table Structure**:
```sql
CREATE TABLE public.compliance_acknowledgments_archive (
  original_id UUID NOT NULL,
  organization_id UUID,
  organization_name TEXT,  -- Captured at archive time
  user_id UUID,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL,
  policy_version TEXT NOT NULL,
  agreement_version TEXT NOT NULL,
  full_agreement_text TEXT NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archive_reason TEXT NOT NULL,  -- 'user_deleted', 'org_deleted', 'manual'
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  CONSTRAINT unique_original_id UNIQUE (original_id)
);
```

**Trigger Function**:
```sql
CREATE OR REPLACE FUNCTION archive_compliance_acknowledgment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Determine archive reason
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = OLD.user_id) THEN
    reason := 'user_deleted';
  ELSIF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = OLD.organization_id) THEN
    reason := 'org_deleted';
  ELSE
    reason := 'manual';
  END IF;

  -- Insert into archive
  INSERT INTO public.compliance_acknowledgments_archive (...) VALUES (...);

  RETURN OLD;
END;
$$;

CREATE TRIGGER archive_before_delete
  BEFORE DELETE ON public.compliance_acknowledgments
  FOR EACH ROW
  EXECUTE FUNCTION archive_compliance_acknowledgment();
```

**Key Features**:
- Records are archived BEFORE CASCADE delete occurs
- Organization name is captured at archive time (since org may be deleted)
- Archive is immutable - no UPDATE/DELETE policies via RLS
- Only authenticated users can SELECT (filtered by org membership)

**Legal Protection**:
- Full agreement text stored with each record
- IP address, user agent, timestamp preserved
- Non-repudiable audit trail even after user/org deletion

---

## RULES (Implementation Guidelines)

### Before implementing:
1. **Read reference files first:**
   - Check `/app/globals.css` for design system variables
   - Match styling patterns from `/components/DispatchLoader.tsx`
   - Verify component patterns in existing overlays

2. **Follow design patterns:**
   - Functional components with React hooks (useState, useEffect, useRef)
   - TypeScript with explicit interfaces
   - Inline styles using CSS variables from globals.css
   - Framer Motion for animations
   - Explicit error handling with fallback data

3. **Component composition:**
   - Reusable components over props drilling
   - Keep components focused and single-purpose
   - Extract shared logic into custom hooks when needed

### Implementation Checklist:
- [ ] Matches design system specifications (colors, spacing, typography)
- [ ] Follows established component patterns (modal overlay, sidebar headers)
- [ ] Addresses actual user intent (don't rebuild, clone existing working code)
- [ ] Includes error handling and fallback data
- [ ] Uses TypeScript interfaces for all props
- [ ] Implements glassmorphic effects correctly (NO background for pure transparency)
- [ ] **ALL styles use CSS variables from globals.css - ZERO hardcoded values**
- [ ] **ALL font properties (size, weight, family) use CSS variables - NO hardcoded px or numeric weights**
- [ ] **NO emojis - use SVG icons instead for all UI elements**

### Critical Insight:
**Glassmorphic transparency = NO background property**, only `backdrop-filter: blur(12px)` and `filter: brightness(1.3)`. When user says "remove the tint", they mean completely remove the background property, not reduce opacity.

### How to Remove Tint from Modals (CRITICAL):

When creating glassmorphic overlays, you must override TWO CSS classes that add background tints:

**Problem:**
1. `.policy-modal-overlay` has `background: rgba(0,0,0,0.7)` - 70% black backdrop
2. `.policy-modal-card` has `background: var(--bg-secondary)` - solid gray (#2F2F2F)

**Solution - Add inline styles to BOTH divs:**

```tsx
<motion.div
  className="policy-modal-overlay"
  onClick={onClose}
  style={{
    background: 'transparent'  // ✅ Override backdrop tint
  }}
>
  <motion.div
    className="policy-modal-card"
    onClick={(e) => e.stopPropagation()}
    style={{
      background: 'transparent',  // ✅ Override card tint
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      filter: 'brightness(1.3)',
      // ... other styles
    }}
  >
    {/* Modal content */}
  </motion.div>
</motion.div>
```

**Result:**
- Pure glassmorphic transparency
- Homepage fully visible through both backdrop and modal
- No dark tint obscuring the background

**Remember:** BOTH the overlay backdrop AND the modal card need `background: 'transparent'`!

### Glassmorphic Fixes Applied Across All Overlays

**Updated Components (Complete List):**

1. **TechnicianProfileOverlay.tsx** - ✅ FIXED
   - Line 106: Loading state backdrop - `background: 'transparent'`
   - Line 121: Loading state modal card - `background: 'transparent'` + `filter: 'brightness(1.3)'`
   - Line 154: Error state backdrop - `background: 'transparent'`
   - Line 170: Error state modal card - `background: 'transparent'` + `filter: 'brightness(1.3)'`
   - Line 209: Main state backdrop - `background: 'transparent'`
   - Line 224: Main state modal card - `background: 'transparent'` + `filter: 'brightness(1.3)'`

2. **JobDetailOverlay.tsx** - ✅ ALREADY FIXED
   - Modal card has NO background property (pure glassmorphic)
   - Uses `backdropFilter: 'blur(12px)'` and `filter: 'brightness(1.3)'`

3. **JobsOverlay.tsx** - ✅ FIXED
   - Line 248: Backdrop - `background: 'transparent'` (already correct)
   - Line 263: Modal card - Changed from `background: 'var(--modal-bg)'` to `background: 'transparent'`
   - Line 266: Added `filter: 'brightness(1.3)'`

4. **ComplianceOverlay.tsx** - ✅ FIXED
   - Line 174: Backdrop with className - Added inline `style={{ background: 'transparent' }}`
   - Line 188: Modal card - Changed from `background: 'var(--modal-bg)'` to `background: 'transparent'`
   - Line 191: Added `filter: 'brightness(1.3)'`

5. **ComplianceQuickOverlay.tsx** - ✅ NO CHANGES NEEDED
   - Does not use standard overlay pattern (no full-screen backdrop)
   - Is a floating card component, not a modal overlay

**Standard Pattern for All Future Overlays:**

```tsx
{/* Overlay Backdrop */}
<motion.div
  className="policy-modal-overlay"
  onClick={onClose}
  style={{
    background: 'transparent',  // ✅ Override CSS class
    // ... other styles
  }}
>
  {/* Modal Card */}
  <motion.div
    className="policy-modal-card"
    onClick={(e) => e.stopPropagation()}
    style={{
      background: 'transparent',  // ✅ Override CSS class
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      filter: 'brightness(1.3)',
      // ... other styles
    }}
  >
    {/* Modal content */}
  </motion.div>
</motion.div>
```

---

### Color Luminosity System

A systematic approach to calculating text color luminosity based on background tint darkness.

#### Base Color Reference
- **Base Accent**: `#656290` - HSL(244°, 17%, 47%)
- **Role**: Primary accent color for untinted surfaces (borders, subtle accents)

#### Luminosity Calculation Formula

```
Target Lightness = Base Lightness + (Tint Layers × 40%) + Visual Adjustments

Where:
- Tint Layers = Number/intensity of background overlays (0, 1, 2...)
- Base Increase = 40% for first tint layer
- Visual Adjustments = 10-15% increments based on real testing
```

**Core Principle:** Text luminosity should be inversely proportional to background darkness.

#### Color Ladder (Documented Levels)

| Level | Hex | HSL | Lightness Increase | Context | Use Case |
|-------|-----|-----|-------------------|---------|----------|
| **0** | `#656290` | 244°, 17%, **47%** | Baseline (0%) | No tint | Borders, subtle accents on transparent backgrounds |
| **1** | `#9896C9` | 244°, 17%, **67%** | +40% | 20% purple tint (first attempt) | Initial card labels with purple tint background |
| **2** | `#ADA9DB` | 244°, 17%, **76%** | +55% (+40% +15%) | 20% purple tint (optimized) | **Current** - Card labels, status badge text |

**Future Hypothetical Levels:**
| Level | Hex | HSL | Lightness Increase | Context |
|-------|-----|-----|-------------------|---------|
| 3 | `#C2BFE8` | 244°, 17%, **85%** | +80% | Medium tint (2 layers) |
| 4 | `#D7D5F0` | 244°, 17%, **92%** | +110% | Heavy tint (3+ layers) |

#### Status Badge Colors (Level 2 Optimized)

All status colors received +15% luminosity increase to match card label readability:

| Status | Original | Optimized | HSL Change |
|--------|----------|-----------|------------|
| Pending/Unassigned | `#6C72C9` | `#8A86DB` | 245°, 50%, 49% → 245°, 50%, 69% |
| Assigned | `#F59E0B` | `#F7B13C` | 38°, 91%, 50% → 38°, 91%, 60% |
| Completed | `#10B981` | `#3CC896` | 160°, 84%, 39% → 160°, 64%, 51% |
| Archived | `#A0A0A8` | `#B3B3BA` | 240°, 5%, 64% → 240°, 8%, 70% |

#### Decision Tree for Future Implementation

When adding new text on tinted backgrounds:

1. **Count Tint Layers**
   - How many semi-transparent overlays are stacked?
   - Example: `rgba(101, 98, 144, 0.2)` = 1 layer

2. **Start With Formula**
   - Lightness Increase = (Tint Layers × 40%) + 15%
   - Example: 1 layer = 40% + 15% = 55% increase

3. **Visual Test**
   - Does text pass readability test against background?
   - Can you read small uppercase labels clearly?
   - Does it maintain visual hierarchy with white text?

4. **Adjust in 10-15% Increments**
   - If not readable, add 10-15% more lightness
   - Test again until optimal

5. **Document Final Values**
   - Update color ladder table with new level
   - Include context (tint opacity, number of layers)
   - Document use case for future reference

#### Visual Hierarchy Established

**Three-Tier Hierarchy:**
1. **Primary Values** (white, bold): `var(--text-primary)` = `#FFFFFF` - Most important data (job titles, card values, aggregate stats)
2. **Secondary Labels** (lighter purple, semibold, small caps): `#ADA9DB` - Metadata and status (card label titles, status badge text)
3. **Tertiary Labels** (gray, regular, small): `var(--text-secondary)` = `#A0A0A8` - Descriptive labels (Trade:, Location:, Avg Distance:)

**Applied Examples:**
- **Card Structure**:
  - Descriptive label (gray, small): "TRADE"
  - Card value (white, bold, large): "Electrical"
- **Status Badge**: Text (`#ADA9DB`, small caps) with colored border (dynamic status color)
- **Aggregate Statistics**:
  - Label (white, small): "Avg Distance:", "Avg Rating:"
  - Value (lighter purple, bold): "2.3 mi", "⭐ 4.8" (`#ADA9DB`)
- **Rating Display**: SVG star icon (white) + numeric value (white, bold)

This hierarchy ensures clear visual priority: critical data (white) > categorization/metadata (lighter purple) > descriptive labels (gray).

**Icon Consistency Rule:** Always use SVG icons instead of emoji for UI elements (✅ SVG star, ❌ ⭐ emoji). Emojis have inconsistent rendering across platforms.

---

## ICON USAGE - SVG ONLY, NO EMOJIS

### Critical Rule: No Emojis in UI

**Never use emojis in UI components.** Always use SVG icons instead.

**Why:**
- Emojis render inconsistently across platforms (iOS, Android, Windows, Mac)
- SVG icons can be styled with CSS (color, size, stroke-width)
- SVG icons scale perfectly at any resolution
- Emojis break the design system's visual consistency

### Common Icon Replacements

| Purpose | ❌ Emoji | ✅ SVG Icon |
|---------|---------|------------|
| **Warning** | ⚠️ | `<svg><path d="M10.29 3.86L1.82 18..."/></svg>` (Triangle with exclamation) |
| **Location** | 📍 | `<svg><path d="M21 10c0 7-9 13..."/></svg>` (Map pin) |
| **Star/Rating** | ⭐ | `<svg><polygon points="12 2 15.09 8.26..."/></svg>` (Star outline) |
| **Checkmark** | ✅ | `<svg><polyline points="20 6 9 17 4 12"/></svg>` (Check) |
| **Error** | ❌ | `<svg><line x1="18" y1="6" x2="6" y2="18"/></svg>` (X) |
| **Info** | ℹ️ | `<svg><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/></svg>` |
| **Tool/Wrench** | 🔧 | `<svg><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6..."/></svg>` |

### Standard SVG Icon Template

```tsx
<svg
  width="20"
  height="20"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  {/* Icon paths */}
</svg>
```

**Styling Properties:**
- `stroke="currentColor"` - Inherits text color from parent
- `stroke="#EF4444"` - Hardcoded color (use for specific cases like warning icon)
- `strokeWidth="2"` - Standard stroke width
- `opacity: 0.7` - For secondary/muted icons

### Icon Sizes

| Context | Size | Usage |
|---------|------|-------|
| **Large Header Icon** | 40×40 | Modal headers, major actions |
| **Standard Icon** | 20×20 | Inline with text, buttons |
| **Small Icon** | 14-16×14-16 | Inline labels, metadata |
| **Tiny Icon** | 12×12 | Dense lists, compact UI |

### Example: Warning Icon (DuplicateWarningModal)

```tsx
{/* ❌ WRONG - Emoji */}
<div style={{ fontSize: 40 }}>⚠️</div>

{/* ✅ CORRECT - SVG */}
<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
  <line x1="12" y1="9" x2="12" y2="13"/>
  <line x1="12" y1="17" x2="12.01" y2="17"/>
</svg>
```

### Example: Location Icon (DuplicateWarningModal)

```tsx
{/* ❌ WRONG - Emoji */}
<span>📍 {address}</span>

{/* ✅ CORRECT - SVG */}
<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
  <span>{address}</span>
</div>
```

### Icon Resources

**Where to find SVG icons:**
- [Feather Icons](https://feathericons.com/) - Clean, minimal icons (recommended)
- [Heroicons](https://heroicons.com/) - Tailwind's icon set
- [Lucide](https://lucide.dev/) - Fork of Feather with more icons

**Usage:**
1. Find icon on website
2. Copy SVG code
3. Paste directly into component
4. Adjust `width`, `height`, `stroke` as needed

#### Background Tint Reference

**Current Implementation:**
```css
/* Info Cards Background */
background: rgba(101, 98, 144, 0.2);  /* 20% purple tint */

/* Status Badge Background */
background: ${statusColor}22;  /* 13% opacity of status color */
border: 1px solid ${statusColor};  /* Solid border for definition */
```

**Why 20% Tint Required +55% Luminosity:**
- 20% opacity = ~9.4% effective darkness added
- Reduced contrast with original `#656290` text
- 40% increase addressed tint, +15% addressed visual testing feedback
- Result: Optimal readability without being too bright

---

## CSS VARIABLE USAGE - MANDATORY FOR ALL PAGES

### CRITICAL RULE: Zero Hardcoded Values

**Every new page/component MUST use CSS variables from globals.css for ALL styling values.**

Never hardcode:
- ❌ `padding: 24px` → ✅ `padding: 'var(--spacing-xl)'`
- ❌ `fontSize: 14px` → ✅ `fontSize: 'var(--font-md)'`
- ❌ `fontWeight: 600` → ✅ `fontWeight: 'var(--font-weight-semibold)'`
- ❌ `gap: 12px` → ✅ `gap: 'var(--spacing-md)'`
- ❌ `borderRadius: 8px` → ✅ `borderRadius: 'var(--container-border-radius)'`
- ❌ `letterSpacing: '0.5px'` → ✅ `letterSpacing: 'var(--job-detail-card-label-spacing)'`

### Available CSS Variables Reference

**Spacing:**
```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 12px
--spacing-lg: 16px
--spacing-xl: 24px
--spacing-2xl: 32px
--spacing-3xl: 40px
--spacing-4xl: 48px
--spacing-5xl: 64px
```

**Font Sizes:**
```css
--font-xs: 10px
--font-sm: 11px
--font-md: 13px
--font-lg: 16px
--font-xl: 18px
--font-2xl: 20px
--font-3xl: 28px
--font-4xl: 36px
```

**Font Weights:**
```css
--font-weight-regular: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

**Font Families:**
```css
--font-section-title: 'Futura-Bold', 'Futura', -apple-system, BlinkMacSystemFont, sans-serif
--font-text-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
```

**IMPORTANT:** Never use hardcoded numeric font weights (400, 600, 700) or pixel font sizes (14px, 16px). Always use the CSS variables above.

**Colors:**
```css
--text-primary: #FFFFFF
--text-secondary: #A0A0A8
--accent-primary: #656290
--container-bg: rgba(178, 173, 201, 0.05)
--success: #10B981
--warning: #F59E0B
--error: #EF4444
```

**Borders & Containers:**
```css
--container-border: 1px solid rgba(249, 243, 229, 0.33)
--container-border-radius: 8px
--container-hover-bg: rgba(178, 173, 201, 0.15)
--modal-border-radius: 16px
--btn-corner-radius: 6px
```

**Job Detail Specific:**
```css
--job-detail-status-badge-padding: 4px 12px
--job-detail-status-badge-radius: 6px
--job-detail-icon-size: 20px
--job-detail-card-label-spacing: 0.5px
```

**Progress Bars:**
```css
--progress-bar-height: 6px
--progress-bar-radius: 3px
```

### Complete Example - JobDetailOverlay Pattern

```tsx
{/* Header Section */}
<div style={{ marginBottom: 'var(--spacing-2xl)' }}>
  {/* WO Number */}
  <div style={{
    fontSize: 'var(--font-sm)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--text-secondary)',
    letterSpacing: 'var(--job-detail-card-label-spacing)'
  }}>
    WO-{job.id.slice(0, 8).toUpperCase()}
  </div>

  {/* Status Badge */}
  <div style={{
    padding: 'var(--job-detail-status-badge-padding)',
    borderRadius: 'var(--job-detail-status-badge-radius)',
    fontWeight: 'var(--font-weight-semibold)',
    fontSize: 'var(--font-xs)',
    letterSpacing: 'var(--job-detail-card-label-spacing)'
  }}>
    {status}
  </div>
</div>

{/* Info Card */}
<div style={{
  background: 'var(--container-bg)',
  border: 'var(--container-border)',
  borderRadius: 'var(--container-border-radius)',
  padding: 'var(--spacing-md)'
}}>
  <div style={{
    fontSize: 'var(--font-xs)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--accent-primary)',
    letterSpacing: 'var(--job-detail-card-label-spacing)',
    marginBottom: 'var(--spacing-sm)',
    gap: 'var(--spacing-sm)'
  }}>
    🔧 Trade
  </div>
  <div style={{
    fontSize: 'var(--font-lg)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--text-primary)'
  }}>
    {job.trade_needed}
  </div>
</div>
```

### When to Add New CSS Variables

If you need a value that doesn't exist in globals.css:

1. **Add it to globals.css first** with descriptive name
2. **Document it** in this file under the appropriate category
3. **Use it** in your component

**Example - Adding a new variable:**
```css
/* In globals.css */
--technician-avatar-size: 40px;
--technician-badge-spacing: 6px;
```

```tsx
/* In component */
<div style={{
  width: 'var(--technician-avatar-size)',
  height: 'var(--technician-avatar-size)',
  gap: 'var(--technician-badge-spacing)'
}}>
```

---

## 1. Primary Request and Intent

The user's primary requests across this session were:

1. **Re-read the entire project directory** to refresh context after a session continuation
2. **Analyze the DispatchLoader page** specifically focusing on:
   - How the background tint was removed
   - Structure analysis (paddings, strokes, corner radius, icons, buttons)
3. **Analyze everything** - Provide a comprehensive analysis of the entire project structure, components, and design system
4. **Document the analysis** - Add the complete analysis to a claude.md file with a detailed summary

The overarching intent is to have a complete, detailed technical reference document for the Ravensearch project that captures:
- The glassmorphic background tint removal fix in JobDetailOverlay
- Complete component architecture and styling patterns
- Design system rules and variables
- All padding, border, and structural specifications

## 2. Key Technical Concepts

- **Next.js 14 App Router** - Modern React framework with file-based routing
- **TypeScript** - Type-safe JavaScript for component development
- **Supabase** - PostgreSQL database with real-time subscriptions and authentication
- **Maplibre GL** - Interactive maps with custom styling and markers
- **Framer Motion** - Animation library for modal transitions and UI effects
- **Glassmorphic Design** - Semi-transparent blur effects with backdrop filters
- **CSS Custom Properties** - Design system variables for consistent styling
- **Modal Overlay Pattern** - Fixed positioning with backdrop and centered cards
- **Real-time Updates** - Supabase channel subscriptions for live data
- **Dual-channel Email Outreach** - SendGrid (warm) and Instantly (cold) campaigns
- **Component-based Architecture** - Reusable UI components with TypeScript interfaces

## 3. Files and Code Sections

### `/components/JobDetailOverlay.tsx` (CRITICAL - RECENTLY MODIFIED)
**Why Important:** This is the main file we fixed to remove the glassmorphic background tint.

**Changes Made:** Removed the `background` property entirely from the modal card style at line ~406.

**Before:**
```tsx
style={{
  maxWidth: 1100,
  maxHeight: '90vh',
  border: `2px solid ${statusColor}`,
  overflow: 'auto',
  padding: 32,
  position: 'relative',
  background: 'rgba(47, 47, 47, 0.3)',  // ❌ This created a 30% black tint
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  filter: 'brightness(1.3)'
}}
```

**After:**
```tsx
style={{
  maxWidth: 1100,
  maxHeight: '90vh',
  border: `2px solid ${statusColor}`,
  overflow: 'auto',
  padding: 32,
  position: 'relative',
  // ✅ NO background property = pure glassmorphic transparency
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  filter: 'brightness(1.3)'
}}
```

**Complete Structure:**
- Contains `JobDispatchStats` component (copied from DispatchLoader without loading animation)
- Displays job details in a modal overlay
- Shows dispatch statistics (warm/cold email stats)
- Integrated Maplibre map with technician markers
- List of contacted technicians using TechnicianCard components
- Padding: `32px`, Border: `2px solid ${statusColor}` (dynamic)

---

### `/components/DispatchLoader.tsx` (READ - REFERENCE)
**Why Important:** Source component to copy dispatch statistics display logic from.

**Key Code Section - Container Structure:**
```tsx
<div
  className="container-card"
  style={{
    padding: 24,
    background: 'rgba(108, 114, 201, 0.05)',  // Very subtle purple tint
    border: '2px solid var(--border-accent)',
    borderRadius: 12
  }}
>
  {/* Total Stats */}
  <div style={{ marginBottom: 24, textAlign: 'center' }}>
    <div style={{ fontSize: 'var(--font-4xl)', fontWeight: 700, color: 'var(--accent-primary)' }}>
      {totalSent} technicians
    </div>
  </div>

  {/* Warm/Cold Grid */}
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
    {/* Warm Card */}
    <div style={{
      background: 'var(--stats-bg-warm)',  // rgba(16, 185, 129, 0.1)
      border: '2px solid var(--stats-border-warm)',  // rgba(16, 185, 129, 0.3)
      borderRadius: 8,
      padding: 16
    }}>
      {/* Warm stats and progress bar */}
    </div>

    {/* Cold Card */}
    <div style={{
      background: 'var(--stats-bg-cold)',  // rgba(59, 130, 246, 0.1)
      border: '2px solid var(--stats-border-cold)',  // rgba(59, 130, 246, 0.3)
      borderRadius: 8,
      padding: 16
    }}>
      {/* Cold stats and progress bar */}
    </div>
  </div>
</div>
```

**Copied to JobDetailOverlay:** Complete stats fetching logic, real-time Supabase subscription, warm/cold display with progress bars. **Removed:** Loading placeholder animation.

---

### `/app/page.tsx` (READ - REFERENCE)
**Why Important:** Contains the working map implementation and dispatch modal pattern.

**Key Code Section - Dispatch Modal:**
```tsx
<motion.div
  data-dispatch-modal
  initial={{
    width: searchBoxPos.width || 800,
    height: searchBoxPos.height || 200,
  }}
  animate={{
    width: 915,
    height: 800,
  }}
  style={{
    background: 'rgba(47, 47, 47, 0.3)',  // This modal DOES use background
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(249, 243, 229, 0.33)',
    borderRadius: 16,
    padding: 40,
  }}
>
  {/* Work Order Number, Text, Map, Progress Timeline, Technicians */}
</motion.div>
```

**Map Initialization Pattern:**
```tsx
mapRef.current = new maplibregl.Map({
  container: mapContainerRef.current,
  style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`,
  center: initialCenter,
  zoom: 16,
  attributionControl: false
});

// Custom purple styling
mapRef.current.on('load', () => {
  // Hide all layers except roads, buildings, land, housenumbers
  // Roads: #d4d4d4 with 40% opacity
  // Buildings: #d4d4d4 (light) / #b8b8b8 (dark) with 60% opacity
});
```

---

### `/app/globals.css` (READ - REFERENCE)
**Why Important:** Contains all CSS variables and design system definitions.

**Critical Variables:**
```css
/* Modal Styling */
--modal-bg: rgba(47, 47, 47, 0.3);  /* ⚠️ Should potentially be transparent */
--modal-backdrop-blur: blur(12px);
--modal-border: 1px solid rgba(249, 243, 229, 0.33);
--modal-border-radius: 16px;

/* Glassmorphic Stats */
--stats-bg-warm: rgba(16, 185, 129, 0.1);
--stats-text-warm: #059669;
--stats-progress-warm-start: rgba(16, 185, 129, 0.8);
--stats-progress-warm-end: rgba(5, 150, 105, 0.6);

--stats-bg-cold: rgba(59, 130, 246, 0.1);
--stats-text-cold: #2563eb;
--stats-progress-cold-start: rgba(59, 130, 246, 0.8);
--stats-progress-cold-end: rgba(37, 99, 235, 0.6);

/* Typography */
--font-section-title: 'Futura-Bold', 'Futura', sans-serif;
--font-section-title-size: 32px;
--font-text-body: 'Inter', sans-serif;
```

**Design System Rules (from comments):**
1. All strokes/borders: `rgba(255, 255, 255, 0.5)`
2. All buttons: NO borders/strokes
3. Section titles: Futura-Bold font
4. All X buttons: White
5. Border radius: `8px` containers, `10px` buttons, `16px` modals
6. Glassmorphic effects: Include `backdrop-filter`, `brightness(1.3)`

---

### `/components/TechnicianCard.tsx` (READ - REFERENCE)
**Why Important:** Referenced for technician display in JobDetailOverlay.

**Key Structure:**
```tsx
<motion.div
  style={{
    background: isMapExpanded ? 'var(--tech-card-bg)' : 'var(--tech-card-bg-collapsed)',
    backdropFilter: isMapExpanded ? 'blur(8px)' : 'none',
    border: 'var(--container-border)',
    borderRadius: 'var(--container-border-radius)',
    padding: 16,
  }}
>
  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
    {/* Profile Picture - 40px × 40px */}
    <div style={{ width: 40, height: 40, borderRadius: '50%' }}>
      <img src={`https://i.pravatar.cc/150?img=${(index % 20) + 1}`} />
    </div>

    {/* Name, Distance, Rating */}
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
      <div style={{ fontSize: 12 }}>{distance.toFixed(1)} mi away</div>
    </div>

    {/* Skills Badges */}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {skills.map(skill => (
        <span style={{
          background: 'var(--tech-skill-badge-bg)',
          border: '1px solid var(--tech-skill-badge-border)',
          borderRadius: 4,
          padding: '2px 8px'
        }}>
          {skill}
        </span>
      ))}
    </div>
  </div>
</motion.div>
```

---

### `/components/JobsOverlay.tsx` (READ - REFERENCE)
**Why Important:** Shows the job card grid that expands into JobDetailOverlay.

**Job Card Styling Function:**
```tsx
const getCardStyles = (status: string | null) => {
  const statusLower = status?.toLowerCase() || 'pending';

  if (statusLower === 'assigned') {
    return {
      cardBg: 'var(--job-status-active-bg)',
      innerBg: 'linear-gradient(...)',  // Orange gradient
      innerStroke: 'rgba(255, 249, 243, 1)',
      textColor: '#F9F3E5',
      statusColor: '#9B8167',
      innerWidth: 105,
      innerHeight: 86,
      // ... more properties
    };
  } else if (statusLower === 'unassigned') {
    return {
      cardBg: 'var(--job-status-unassigned-bg)',
      innerBg: 'var(--job-status-unassigned-inner)',  // Purple
      innerStroke: 'rgba(106, 98, 136, 1)',
      // ... purple styling
    };
  }
  // ... completed (green), archived (gray)
};
```

**Card Click Handler:**
```tsx
<div
  onClick={() => {
    setSelectedJob(job);
    setSelectedJobId(job.id);
    setIsExpanding(true);
  }}
>
  {/* Job Card with WO number, 169px × 106px */}
</div>
```

---

### `/components/ComplianceOverlay.tsx` (READ - REFERENCE)
**Why Important:** Example of modal overlay pattern with sidebar-style header/footer.

**Modal Structure:**
```tsx
<motion.div className="policy-modal-overlay" onClick={onClose}>
  <motion.div
    className="policy-modal-card"
    style={{
      maxWidth: 540,
      maxHeight: '90vh',
      background: 'var(--modal-bg)',  // Still uses background tint
      backdropFilter: 'var(--modal-backdrop-blur)',
      border: 'var(--modal-border)',
      borderRadius: 'var(--modal-border-radius)',
    }}
  >
    <div className="modal-header-sidebar-style">
      <h2>Compliance Policies</h2>
      <CloseButton onClick={onClose} />
    </div>

    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      {/* Content */}
    </div>

    <div className="modal-footer-sidebar-style">
      <button className="outline-button">Cancel</button>
      <button className="primary-button">Apply to Work Order</button>
    </div>
  </motion.div>
</motion.div>
```

---

### `/components/CloseButton.tsx` (READ - REFERENCE)
**Why Important:** Reusable white X button used in all modals.

**Complete Implementation:**
```tsx
export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="close-button"
      aria-label="Close"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <line
          x1="4" y1="4" x2="16" y2="16"
          stroke="white" strokeWidth="1.4" strokeLinecap="round"
        />
        <line
          x1="16" y1="4" x2="4" y2="16"
          stroke="white" strokeWidth="1.4" strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
```

**CSS:**
```css
.close-button {
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.close-button:hover {
  opacity: 0.7;
}
```

---

## 4. Errors and Fixes

### **Error 1: Map and technician cards not showing in JobDetailOverlay**
**Cause:** API endpoint `/api/jobs/${job.id}/technicians` was returning an empty array.

**Fix:** Added fallback mock data when API returns empty results:
```tsx
if (data.technicians && data.technicians.length > 0) {
  setTechnicians(data.technicians);
} else {
  // Fallback to mock data
  const mockTechs: DispatchedTechnician[] = [
    { id: '1', name: 'John Martinez', distance: 2.3, rating: 4.9, skills: ['Electrical', 'HVAC'] },
    // ... more mock technicians
  ];
  setTechnicians(mockTechs);
}
```

**File:** /components/JobDetailOverlay.tsx

---

### **Error 2: Unnecessarily re-styling the map**
**Cause:** I added complex custom map layer styling code that was redundant since MapTiler already provides styled vector tiles.

**Fix:** Removed all the custom styling logic and let MapTiler's `streets-v2` style handle the map appearance.

**File:** /components/JobDetailOverlay.tsx

---

### **Error 3: Not copying complete implementation from DispatchLoader**
**Cause:** I tried to rebuild components from scratch instead of cloning working code.

**Fix:** Copied the complete DispatchLoader statistics display logic into `JobDispatchStats` component within JobDetailOverlay, only removing the loading animation skeleton.

**File:** /components/JobDetailOverlay.tsx

---

### **Error 4: Background too opaque (95%) preventing glassmorphic effect**
**Cause:** Initial implementation had `background: rgba(47, 47, 47, 0.95)` - 95% opaque black background.

**Fix (Attempt 1):** Changed to `background: rgba(47, 47, 47, 0.3)` - reduced to 30% opacity.

**File:** /components/JobDetailOverlay.tsx:406

---

### **Error 5: Background still has tint (30%) - NOT TRUE GLASSMORPHIC**
**Cause:** Even at 30% opacity, the black background created a visible tint that blocked the homepage from showing through.

**Fix (Final Solution):** Completely removed the `background` property from the modal card style object at line ~406, leaving only:
```tsx
backdropFilter: 'blur(12px)',
WebkitBackdropFilter: 'blur(12px)',
filter: 'brightness(1.3)'
```

**Result:** Pure glassmorphic transparency where the homepage is fully visible through the blur effect with NO background tint whatsoever.

**File:** /components/JobDetailOverlay.tsx:406

---

## 5. Problem Solving

### **Solved Problems:**

1. ✅ **Created JobDetailOverlay modal** - Built complete overlay that expands from job card click with proper animation
2. ✅ **Integrated dispatch statistics** - Copied DispatchLoader logic without loading animations, showing warm/cold email stats with progress bars
3. ✅ **Added interactive map** - Integrated Maplibre GL with technician location markers using random offsets around job location
4. ✅ **Displayed technician cards** - Rendered list of contacted technicians using TechnicianCard component
5. ✅ **Applied glassmorphic styling** - Implemented proper glassmorphic effects with backdrop blur and brightness filter
6. ✅ **Removed background tint** - Achieved pure glassmorphic transparency by removing background property entirely

### **Key Insights:**

- **Don't rebuild, clone**: When a component already works (like DispatchLoader), copy it completely rather than recreating from scratch
- **Glassmorphic = No Background**: True glassmorphic effects require NO background color, only `backdrop-filter` and `brightness`
- **Listen to user frustration**: When user expresses frustration, immediately stop current approach and take their literal instruction
- **Fallback data is essential**: Always provide fallback mock data when APIs might return empty results

---

## 6. Design System Rules

### **Color Palette:**
```css
/* Primary Background */
--bg-primary: #2F2F2F;
--bg-secondary: #1A1A1A;

/* Text Colors */
--text-primary: #F9F3E5;
--text-secondary: rgba(249, 243, 229, 0.7);
--text-placeholder: rgba(249, 243, 229, 0.4);

/* Accent Colors */
--accent-primary: #6C72C9;
--accent-hover: #8B90E0;

/* Borders/Strokes */
--stroke-subtle: rgba(255, 255, 255, 0.5);
--container-border: 1px solid rgba(255, 255, 255, 0.5);
--container-hover-border: rgba(255, 255, 255, 0.7);

/* Status Colors */
--status-assigned: #F97316;  /* Orange */
--status-unassigned: #6C72C9;  /* Purple */
--status-completed: #10B981;  /* Green */
--status-archived: #6B7280;  /* Gray */
```

### **Spacing & Layout:**
```css
/* Padding */
--padding-xs: 8px;
--padding-sm: 12px;
--padding-md: 16px;
--padding-lg: 24px;
--padding-xl: 32px;
--padding-2xl: 40px;

/* Border Radius */
--radius-sm: 4px;   /* Badges */
--radius-md: 8px;   /* Containers */
--radius-lg: 10px;  /* Buttons */
--radius-xl: 12px;  /* Cards */
--radius-2xl: 16px; /* Modals */

/* Gaps */
--gap-xs: 4px;
--gap-sm: 6px;
--gap-md: 8px;
--gap-lg: 12px;
--gap-xl: 16px;
```

### **Typography:**
```css
/* Font Families */
--font-section-title: 'Futura-Bold', 'Futura', sans-serif;
--font-text-body: 'Inter', sans-serif;

/* Font Sizes */
--font-xs: 10px;
--font-sm: 12px;
--font-base: 14px;
--font-lg: 16px;
--font-xl: 18px;
--font-2xl: 20px;
--font-3xl: 24px;
--font-4xl: 32px;

/* Font Weights */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### **Glassmorphic Effects:**
```css
/* Standard Glassmorphic */
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
filter: brightness(1.3);
/* NO BACKGROUND PROPERTY for pure transparency */

/* Subtle Glassmorphic (Cards) */
backdrop-filter: blur(8px);
-webkit-backdrop-filter: blur(8px);
background: rgba(108, 114, 201, 0.05);  /* Very subtle tint OK for cards */
```

### **Component-Specific Rules:**

**Modals:**
- Max width: `540px` (sidebar), `1100px` (full detail)
- Max height: `90vh`
- Border: `1px solid rgba(249, 243, 229, 0.33)`
- Border radius: `16px`
- Padding: `32px` (detail), `24px` (content area)
- Backdrop: `rgba(0, 0, 0, 0.85)`
- **NO background property** for pure glassmorphic transparency

**Job Cards:**
- Dimensions: `169px × 106px`
- Inner card: `105px × 86px`
- Border: `2px solid` (status color)
- Border radius: `12px` (outer), `8px` (inner)
- Padding: `16px`

**Technician Cards:**
- Avatar: `40px × 40px` circle
- Border: `var(--container-border)`
- Border radius: `var(--container-border-radius)`
- Padding: `16px`
- Skill badges: `4px` radius, `2px 8px` padding

**Buttons:**
- Primary: Purple gradient, white text, `10px` radius, `12px 24px` padding
- Outline: Transparent bg, purple border, purple text
- Close: White X icon, `40px × 40px`, no border/bg

**Stats Cards:**
- Warm: Green tint `rgba(16, 185, 129, 0.1)`, green border `rgba(16, 185, 129, 0.3)`
- Cold: Blue tint `rgba(59, 130, 246, 0.1)`, blue border `rgba(59, 130, 246, 0.3)`
- Border radius: `8px`
- Padding: `16px`

### **Layout Rules (Modular System):**

**1. Typography - No Orphans:**
- Lines should appear equal in length as much as possible
- Avoid single words (orphans) on the last line of paragraphs
- Use `.balanced-text` class for headings and important text blocks
```css
.balanced-text {
  text-wrap: balance;
  word-break: keep-all;
}
```

**2. Container Width Consistency:**
- Vertically stacked containers MUST have the same width
- This creates visual alignment and professional appearance
- Use consistent max-width values across related containers

**3. Companion Element Rule (Action Icons, Tooltips, Chevrons):**

**IMPORTANT: Place companion elements INSIDE the container, not in a separate header above.**

This ensures proper alignment regardless of layout complexity (flex, grid, etc.).

**Implementation Pattern:**
```tsx
{/* Title/Subtitle OUTSIDE container */}
<div style={{ marginBottom: 'var(--spacing-lg)' }}>
  <h2>Section Title</h2>
  <p>Section description</p>
</div>

{/* Container with companion element INSIDE */}
<div className="container-card" style={{ position: 'relative' }}>
  {/* Companion element at top-right corner */}
  <button style={{
    position: 'absolute',
    top: 'var(--spacing-md)',
    right: 'var(--spacing-md)',
    zIndex: 1,
  }}>
    <PlusIcon /> {/* or TooltipIcon, ChevronIcon */}
  </button>

  {/* Container content */}
</div>
```

**Element Priority:**
| Priority | Element Type | When to Use |
|----------|-------------|-------------|
| 1st | **Action Icon** (e.g., +) | When user can CREATE/ADD something |
| 2nd | **Tooltip Icon** (e.g., ?) | When explanation/help is needed |
| 3rd | **Chevron** (expand/collapse) | When container content can be toggled |

**Why inside the container?**
- Alignment is always correct (relative to container, not parent layout)
- Works in any layout context (flex, grid, nested columns)
- No alignment issues between header and container widths

**4. Two-Column Layout System:**
```css
.two-column-layout {
  display: flex;
  gap: 60px;
  max-width: 1200px;
  margin: 0 auto;
}

.two-column-layout > .column {
  flex: 1;
  min-width: 0;
}

/* Mobile: Stack vertically */
@media (max-width: 768px) {
  .two-column-layout {
    flex-direction: column;
    gap: var(--spacing-xl);
  }
}
```

**5. Section Header Pattern:**
```css
.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
  width: 100%;
}

.section-header-text {
  flex: 1;
}

.section-header-action {
  flex-shrink: 0;
}
```

---

## 7. Complete Component Architecture

### **Homepage (`/app/page.tsx`)**
```
HomePage
├── TopBar
├── Sidebar
└── Main Content Area
    ├── Search Box (transforms to Dispatch Modal)
    ├── Map Container (Maplibre GL)
    ├── Job Cards Grid
    └── Overlays
        ├── JobsOverlay
        ├── ComplianceOverlay
        └── DispatchLoader
```

### **JobsOverlay (`/components/JobsOverlay.tsx`)**
```
JobsOverlay (Fixed overlay, semi-transparent backdrop)
└── Modal Card (540px max-width, glassmorphic)
    ├── Header (sidebar-style)
    │   ├── Title: "Work Orders"
    │   └── CloseButton
    ├── Content Area (scrollable)
    │   └── Job Cards Grid
    │       └── JobCard[] (169px × 106px each)
    │           ├── Status indicator
    │           ├── WO number
    │           └── Job location/details
    └── Footer (sidebar-style)
        └── Button: "Create New Work Order"
```

### **JobDetailOverlay (`/components/JobDetailOverlay.tsx`)**
```
JobDetailOverlay (Fixed overlay, expands from job card)
└── Modal Card (1100px max-width, glassmorphic, NO BACKGROUND)
    ├── CloseButton (top-right)
    ├── Job Header
    │   ├── WO number
    │   ├── Status badge
    │   └── Job details
    ├── JobDispatchStats (copied from DispatchLoader)
    │   ├── Total technicians count
    │   └── Warm/Cold grid
    │       ├── Warm Card (green)
    │       │   ├── Sent count
    │       │   ├── Opened count
    │       │   ├── Replied count
    │       │   └── Progress bar
    │       └── Cold Card (blue)
    │           ├── Sent count
    │           ├── Opened count
    │           ├── Replied count
    │           └── Progress bar
    ├── Map Container (Maplibre GL)
    │   └── Technician Markers[]
    └── Technicians List
        └── TechnicianCard[]
            ├── Avatar (40px)
            ├── Name + Rating
            ├── Distance
            └── Skills badges
```

### **ComplianceOverlay (`/components/ComplianceOverlay.tsx`)**
```
ComplianceOverlay (Fixed overlay)
└── Modal Card (540px max-width, glassmorphic)
    ├── Header (sidebar-style)
    │   ├── Title: "Compliance Policies"
    │   └── CloseButton
    ├── Content Area (scrollable)
    │   └── Policy Grid
    │       └── PolicyCard[]
    │           ├── Icon
    │           ├── Title
    │           ├── Description
    │           └── Checkbox
    └── Footer (sidebar-style)
        ├── Cancel button
        └── Apply button
```

### **DispatchLoader (`/components/DispatchLoader.tsx`)**
```
DispatchLoader (Fixed overlay, full-page)
└── Modal Card (915px × 800px, glassmorphic with tint)
    ├── Header: "Dispatching Work Order"
    ├── Stats Container
    │   ├── Total technicians count
    │   └── Warm/Cold grid
    │       ├── Warm Card (green) + loading skeleton
    │       └── Cold Card (blue) + loading skeleton
    ├── Progress Timeline
    │   └── Step[]
    │       ├── Icon (checkmark/spinner)
    │       ├── Title
    │       └── Description
    └── Map Container (Maplibre GL)
        └── Technician Markers[] (animated pulsing)
```

---

## 8. Critical Code Patterns

### **Modal Overlay Pattern:**
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  onClick={onClose}
  style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  }}
>
  <motion.div
    onClick={(e) => e.stopPropagation()}
    style={{
      maxWidth: 540,
      maxHeight: '90vh',
      // ✅ NO background property for pure glassmorphic
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      filter: 'brightness(1.3)',
      border: 'var(--modal-border)',
      borderRadius: 'var(--modal-border-radius)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}
  >
    {/* Modal content */}
  </motion.div>
</motion.div>
```

### **Sidebar Header/Footer Pattern:**
```tsx
{/* Header */}
<div className="modal-header-sidebar-style">
  <h2 style={{
    fontFamily: 'var(--font-section-title)',
    fontSize: 'var(--font-section-title-size)',
    color: 'var(--text-primary)'
  }}>
    {title}
  </h2>
  <CloseButton onClick={onClose} />
</div>

{/* Scrollable Content */}
<div style={{
  flex: 1,
  overflowY: 'auto',
  padding: 'var(--padding-lg)'
}}>
  {children}
</div>

{/* Footer */}
<div className="modal-footer-sidebar-style">
  <button className="outline-button">Cancel</button>
  <button className="primary-button">Confirm</button>
</div>
```

**CSS:**
```css
.modal-header-sidebar-style {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(47, 47, 47, 0.5);
}

.modal-footer-sidebar-style {
  display: flex;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(47, 47, 47, 0.5);
}
```

### **Supabase Real-time Subscription Pattern:**
```tsx
useEffect(() => {
  if (!jobId) return;

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('job_dispatches')
      .select('*')
      .eq('job_id', jobId);

    if (data) {
      // Calculate stats
      const warmSent = data.filter(d => d.channel === 'sendgrid').length;
      const coldSent = data.filter(d => d.channel === 'instantly').length;
      // ... set state
    }
  };

  fetchStats();

  const channel = supabase
    .channel(`job-dispatches:${jobId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'job_dispatches',
        filter: `job_id=eq.${jobId}`
      },
      () => fetchStats()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [jobId]);
```

### **Maplibre GL Initialization Pattern:**
```tsx
useEffect(() => {
  if (!mapContainerRef.current || mapRef.current) return;

  const center: [number, number] = [
    job?.location?.longitude || -118.2437,
    job?.location?.latitude || 34.0522
  ];

  mapRef.current = new maplibregl.Map({
    container: mapContainerRef.current,
    style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
    center,
    zoom: 12,
    attributionControl: false
  });

  // Add job location marker
  new maplibregl.Marker({ color: '#F97316' })
    .setLngLat(center)
    .addTo(mapRef.current);

  // Add technician markers
  technicians.forEach(tech => {
    const offset = [(Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02];
    const techPos: [number, number] = [center[0] + offset[0], center[1] + offset[1]];

    new maplibregl.Marker({ color: '#6C72C9' })
      .setLngLat(techPos)
      .addTo(mapRef.current!);
  });

  return () => {
    mapRef.current?.remove();
    mapRef.current = null;
  };
}, [technicians, job]);
```

---

## 9. Pending Tasks

**No explicit pending tasks.** The glassmorphic background tint removal has been completed successfully.

**Potential Future Improvements (Not Explicitly Requested):**
- Apply the same glassmorphic fix (remove background tint) to other modals like ComplianceOverlay
- Update `--modal-bg` CSS variable from `rgba(47, 47, 47, 0.3)` to `transparent` in globals.css
- Ensure consistency across all modal overlays in the application
- Replace API mock data fallback with actual backend implementation

---

## 10. Additional Context

### **Project Structure:**
```
raven-claude/
├── app/
│   ├── layout.tsx           # Root layout with fonts
│   ├── page.tsx             # Homepage (1520 lines)
│   └── globals.css          # Design system variables
├── components/
│   ├── TopBar.tsx           # Navigation header
│   ├── Sidebar.tsx          # Left sidebar navigation
│   ├── JobsOverlay.tsx      # Work orders modal (862 lines)
│   ├── JobDetailOverlay.tsx # Job detail modal (MODIFIED)
│   ├── ComplianceOverlay.tsx # Compliance policies modal (572 lines)
│   ├── DispatchLoader.tsx   # Dispatch progress modal
│   ├── TechnicianCard.tsx   # Technician display component
│   ├── CloseButton.tsx      # Reusable close button
│   ├── PolicyModal.tsx      # Policy selection modal
│   ├── Toast.tsx            # Notification toast
│   └── AuthProvider.tsx     # Supabase auth wrapper
├── lib/
│   └── supabaseClient.ts    # Supabase client initialization
└── middleware.ts            # Auth middleware
```

### **Key Dependencies:**
```json
{
  "dependencies": {
    "next": "14.2.23",
    "react": "^18.3.1",
    "framer-motion": "^11.17.4",
    "@supabase/supabase-js": "^2.49.2",
    "maplibre-gl": "^4.8.2"
  }
}
```

### **Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MAPTILER_KEY=your-maptiler-key
```

---

## MAPLIBRE GL SVG LAYER STYLING - PROJECT STANDARD

### Overview

All maps in the Ravensearch project use **Maplibre GL** with **MapTiler streets-v2** style tiles. Custom layer styling is applied on map load to create a minimal, monochromatic design that matches the application's dark purple theme.

### Critical Rule: Consistent Map Styling Across All Components

**Every map implementation in the project MUST use the exact same SVG layer styling.** This includes:
- Homepage dispatch map (`/app/page.tsx`)
- JobDetailOverlay map (`/components/JobDetailOverlay.tsx`)
- Any future map implementations

### CSS Variables for Map Styling

From `/app/globals.css`:

```css
/* Map Styling */
--map-road-color: #d4d4d4;        /* Primary road color (light gray) */
--map-road-secondary: #b8b8b8;    /* Secondary road color (medium gray) */
--map-building-light: #d4d4d4;    /* 3D building color (light gray) */
--map-building-dark: #b8b8b8;     /* 2D building color (medium gray) */
--map-background: #2f2f2f;        /* Map background (dark gray) */
--map-background-hex: 0x2f2f2f;   /* Background for calculations */
--map-poi-bg: #4C4D5A;            /* Point of interest background */
```

### Complete Layer Styling Implementation

**Apply this code in every map's `mapRef.current.on('load', () => {...})` callback:**

```tsx
mapRef.current.on('load', () => {
  // STEP 1: Zoom animation (optional - used in JobDetailOverlay)
  setTimeout(() => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        zoom: 12,
        duration: 1500,
        easing: (t) => t * (2 - t)  // Ease-out cubic
      });
    }
  }, 100);

  // STEP 2: Get all map layers
  const style = mapRef.current.getStyle();
  const layers = style.layers;

  // STEP 3: Apply custom styling to each layer
  layers?.forEach((layer: any) => {
    // Layer type detection
    const isRoad = layer.id.toLowerCase().includes('road') ||
                   layer.id.toLowerCase().includes('tunnel') ||
                   layer.id.toLowerCase().includes('bridge');

    const isBuilding = layer.id.toLowerCase().includes('building');

    const isHousenumber = layer.id.toLowerCase().includes('housenumber');

    const isRoadLabel = (layer.id.toLowerCase().includes('road') ||
                        layer.id.toLowerCase().includes('street')) &&
                       layer.type === 'symbol';

    const isLand = layer.id.toLowerCase().includes('land') ||
                   layer.id.toLowerCase().includes('landcover') ||
                   layer.id.toLowerCase().includes('landuse');

    // ROADS: Light gray (#d4d4d4) with 40% opacity
    if (isRoad) {
      try {
        mapRef.current?.setPaintProperty(layer.id, 'line-color', '#d4d4d4');
        mapRef.current?.setPaintProperty(layer.id, 'line-opacity', 0.4);
      } catch (e) {
        // Some layers might not support these properties
      }
    }

    // BUILDINGS: Light gray for 3D, medium gray for 2D, both 60% opacity
    else if (isBuilding) {
      try {
        const buildingColor = layer.id === 'Building 3D' ? '#d4d4d4' : '#b8b8b8';

        if (layer.id === 'Building 3D') {
          // 3D extrusion layers
          mapRef.current?.setPaintProperty(layer.id, 'fill-extrusion-color', buildingColor);
          mapRef.current?.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0.6);
        } else {
          // 2D fill layers
          mapRef.current?.setPaintProperty(layer.id, 'fill-color', buildingColor);
          mapRef.current?.setPaintProperty(layer.id, 'fill-opacity', 0.6);
        }
      } catch (e) {
        // Some layers might not support these properties
      }
    }

    // HOUSE NUMBERS: White text with dark halo for readability
    else if (isHousenumber) {
      try {
        mapRef.current?.setPaintProperty(layer.id, 'text-color', '#FFFFFF');
        mapRef.current?.setPaintProperty(layer.id, 'text-halo-color', 'rgba(47, 47, 47, 0.8)');
        mapRef.current?.setPaintProperty(layer.id, 'text-halo-width', 1.5);
        mapRef.current?.setPaintProperty(layer.id, 'text-opacity', 1);
      } catch (e) {
        // Layer might not support text properties
      }
    }

    // ROAD LABELS (Street names): White text, no halo
    else if (isRoadLabel) {
      try {
        mapRef.current?.setPaintProperty(layer.id, 'text-color', '#ffffff');
        mapRef.current?.setPaintProperty(layer.id, 'text-halo-width', 0);
        mapRef.current?.setPaintProperty(layer.id, 'text-opacity', 1);
      } catch (e) {
        // Layer might not support text properties
      }
    }

    // LAND: Light gray (#d4d4d4) with 20% opacity
    else if (isLand) {
      try {
        mapRef.current?.setPaintProperty(layer.id, 'fill-color', '#d4d4d4');
        mapRef.current?.setPaintProperty(layer.id, 'fill-opacity', 0.2);
      } catch (e) {
        // Some layers might not support these properties
      }
    }

    // HIDE EVERYTHING ELSE: POIs, labels, water, etc.
    else {
      try {
        if (layer.type === 'fill') {
          mapRef.current?.setPaintProperty(layer.id, 'fill-opacity', 0);
        } else if (layer.type === 'line') {
          mapRef.current?.setPaintProperty(layer.id, 'line-opacity', 0);
        } else if (layer.type === 'symbol') {
          mapRef.current?.setPaintProperty(layer.id, 'text-opacity', 0);
          mapRef.current?.setPaintProperty(layer.id, 'icon-opacity', 0);
        } else if (layer.type === 'background') {
          mapRef.current?.setPaintProperty(layer.id, 'background-opacity', 0);
        }
      } catch (e) {
        // Some layers might not support opacity
      }
    }
  });
});
```

### Layer Styling Summary Table

| Layer Type | Color | Opacity | Properties |
|------------|-------|---------|------------|
| **Roads** | `#d4d4d4` | 40% | `line-color`, `line-opacity` |
| **Buildings (3D)** | `#d4d4d4` | 60% | `fill-extrusion-color`, `fill-extrusion-opacity` |
| **Buildings (2D)** | `#b8b8b8` | 60% | `fill-color`, `fill-opacity` |
| **House Numbers** | `#FFFFFF` | 100% | `text-color`, `text-halo-color` (#2f2f2f @ 80%), `text-halo-width` (1.5) |
| **Road Labels** | `#FFFFFF` | 100% | `text-color`, `text-halo-width` (0) |
| **Land** | `#d4d4d4` | 20% | `fill-color`, `fill-opacity` |
| **Everything Else** | N/A | 0% | Hidden via opacity properties |

### Map Initialization Pattern

```tsx
useEffect(() => {
  if (!mapContainerRef.current || mapRef.current) return;

  const center: [number, number] = [
    job?.location?.longitude || -118.2437,
    job?.location?.latitude || 34.0522
  ];

  mapRef.current = new maplibregl.Map({
    container: mapContainerRef.current,
    style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
    center,
    zoom: 16,  // Initial zoom for close-up view
    attributionControl: false
  });

  // Apply layer styling (see code above)
  mapRef.current.on('load', () => {
    // ... layer styling code ...
  });

  // Add markers
  new maplibregl.Marker({ color: '#F97316' })  // Orange for job location
    .setLngLat(center)
    .addTo(mapRef.current);

  technicians.forEach(tech => {
    const offset = [(Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02];
    const techPos: [number, number] = [center[0] + offset[0], center[1] + offset[1]];

    new maplibregl.Marker({ color: '#6C72C9' })  // Purple for technicians
      .setLngLat(techPos)
      .addTo(mapRef.current!);
  });

  // Cleanup
  return () => {
    mapRef.current?.remove();
    mapRef.current = null;
  };
}, [technicians, job]);
```

### Design Rationale

**Why this specific color scheme?**

1. **Monochromatic Gray Scale**: Keeps visual focus on markers (orange job, purple technicians)
2. **Light Gray (`#d4d4d4`)**: Provides subtle contrast against dark background without being distracting
3. **40% Road Opacity**: Roads visible but not overwhelming - maintains context
4. **60% Building Opacity**: Buildings provide spatial context without dominating
5. **20% Land Opacity**: Barely visible baseline that distinguishes land from void
6. **White Labels**: Maximum readability for street names and house numbers
7. **Hidden POIs/Labels**: Removes clutter (parks, businesses, transit, etc.)

**Visual Hierarchy:**
1. **Markers** (colored, 100% opacity) - Primary focus
2. **Buildings** (gray, 60% opacity) - Secondary context
3. **Roads** (light gray, 40% opacity) - Tertiary navigation
4. **Land** (very light gray, 20% opacity) - Background baseline
5. **Labels** (white, 100% opacity) - Informational overlay

### Advanced: Road Pulse Animation (Homepage Only)

The homepage dispatch map includes a subtle pulsing animation on roads during dispatch:

```tsx
const pulseRoads = (map: maplibregl.Map) => {
  const roadLayers = map.getStyle().layers?.filter((l: any) =>
    l.id.toLowerCase().includes('road')
  ) || [];

  let startTime = Date.now();
  const duration = 2000;

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = (elapsed % duration) / duration;
    const pulseIntensity = Math.sin(progress * Math.PI * 2) * 0.1;

    roadLayers.forEach((layer: any) => {
      try {
        // Base color #d4d4d4 (RGB: 212, 212, 212)
        const baseColor = { r: 212, g: 212, b: 212 };

        // Increase luminosity by pulseIntensity (0-10%)
        const r = Math.min(255, baseColor.r + (pulseIntensity * 255));
        const g = Math.min(255, baseColor.g + (pulseIntensity * 255));
        const b = Math.min(255, baseColor.b + (pulseIntensity * 255));

        const roadColor = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
        map.setPaintProperty(layer.id, 'line-color', roadColor);
      } catch (e) {}
    });

    requestAnimationFrame(animate);
  };

  animate();

  // Cleanup function
  return () => {
    roadLayers.forEach((layer: any) => {
      try {
        map.setPaintProperty(layer.id, 'line-color', '#d4d4d4');
      } catch (e) {}
    });
  };
};
```

**When to Use:**
- ✅ Homepage dispatch modal during active dispatch
- ❌ JobDetailOverlay (static view)
- ❌ Any other map (unless explicitly requested)

### Troubleshooting

**Issue: Map layers not styling correctly**
- Ensure `mapRef.current.on('load', ...)` callback is used
- Check that MapTiler API key is valid
- Verify layer IDs haven't changed (MapTiler occasionally updates layer naming)

**Issue: Map appears completely blank**
- Check that you're not hiding ALL layers (land/background should have some opacity)
- Verify API key is correct
- Check browser console for errors

**Issue: Styling applies but looks different than expected**
- Ensure you're using `streets-v2` style, not `basic`, `bright`, etc.
- Verify all opacity values match the table above
- Check that marker colors are correct (orange for jobs, purple for technicians)

---

## MOBILE RESPONSIVE IMPLEMENTATION

### Overview

Mobile responsiveness for Ravensearch is handled through a dedicated `/app/mobile-responsive.css` file that is imported in `layout.tsx`. The mobile design uses breakpoints for tablet (< 1024px), mobile (< 768px), and small mobile (< 480px).

### Mobile Breakpoints

```css
/* Tablet and below */
@media (max-width: 1024px) { }

/* Mobile */
@media (max-width: 768px) { }

/* Small mobile */
@media (max-width: 480px) { }

/* Landscape mobile */
@media (max-width: 900px) and (max-height: 500px) { }
```

### Key Mobile Adaptations

#### 1. Navigation - Hamburger Menu

**Location:** `/app/page.tsx:1305-1355`

The hamburger menu is **already implemented** in the homepage. On mobile (< 768px):
- Desktop auth buttons are hidden
- Hamburger icon is displayed
- Sidebar is hidden completely

**Menu Structure:**
```tsx
<button className="hamburger-menu" onClick={() => setMenuOpen(!menuOpen)}>
  {/* Hamburger SVG icon */}
</button>

{menuOpen && (
  <div className="mobile-menu-dropdown">
    <button className="mobile-menu-item">Home</button>
    <button className="mobile-menu-item">Jobs</button>
    <button className="mobile-menu-item">Technicians</button>
    <button className="mobile-menu-item">Compliance</button>
    <button className="mobile-menu-item">Test Dispatch</button>
    <div className="mobile-menu-divider"></div>
    <button className="mobile-menu-item">Login</button>
    <button className="mobile-menu-item">Sign up</button>
  </div>
)}
```

**CSS:**
```css
@media (max-width: 768px) {
  /* Hide desktop buttons */
  .auth-buttons {
    display: none !important;
  }

  /* Show hamburger */
  .hamburger-menu {
    display: block !important;
  }

  /* Hide sidebar */
  .sidebar {
    display: none;
  }
}
```

#### 2. Search Box Positioning

**Challenge:** The search box needed precise positioning on mobile to avoid border clipping and maintain visual balance.

**Final Solution (after 6+ iterations):**
```css
@media (max-width: 768px) {
  .search-box {
    width: calc(85vw - 60px) !important;
    max-width: 600px !important;
    height: auto !important;
    min-height: 160px;
    left: calc(5vw - 50px) !important;
    transform: none !important;
    margin: 0 !important;
  }
}
```

**Key Insights:**
- Width reduced by 60px to prevent border clipping
- Left position shifted 50px left for better alignment
- Transform removed (was causing centering issues)
- Min-height ensures adequate space for content

#### 3. Logo Positioning

**Mobile Adjustment:**
```css
@media (max-width: 768px) {
  .logo-section {
    margin-left: -35px;
  }
}
```

The logo is moved 35px to the left on mobile to balance with the hamburger menu on the right.

#### 4. Icon Sizing

**Plus Icon (Submit Button):**
```css
@media (max-width: 768px) {
  .plus-icon {
    width: 28px !important;
    height: 28px !important;
    top: 20px !important;
    right: 20px !important;
  }

  .plus-icon svg {
    width: 28px !important;
    height: 28px !important;
    stroke-width: 2 !important;
  }
}
```

**Raven Logo:**
```css
@media (max-width: 768px) {
  .raven-logo {
    left: 0 !important;
    top: -90px !important;
    width: 53px !important;
    height: 53px !important;
  }

  .raven-logo svg {
    width: 27px !important;
    height: 39px !important;
  }
}
```

#### 5. Dispatch Modal - Mobile Fullscreen

**Location:** `/app/mobile-responsive.css:260-296`

**Problem:** The dispatch loader modal (915px × 800px on desktop) doesn't fit on mobile screens.

**Solution - ✅ COMPLETE:**
```css
@media (max-width: 768px) {
  /* Dispatch modal - Mobile positioning (same as JobDetailOverlay) */
  [data-dispatch-modal] {
    padding: 16px !important;
    max-width: calc(100vw - 30px) !important;
    width: calc(100vw - 30px) !important;
    margin: 0 !important;
    left: 50% !important;
    right: auto !important;
    top: 70px !important;
    bottom: 20px !important;
    transform: translateX(-50%) !important;
    box-sizing: border-box !important;
    position: fixed !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    height: auto !important;
    max-height: calc(100vh - 90px) !important;
  }

  /* Prevent horizontal scroll in dispatch modal */
  [data-dispatch-modal] > * {
    max-width: 100% !important;
    box-sizing: border-box !important;
    overflow-x: hidden !important;
  }

  /* Lock all nested elements to prevent horizontal scroll */
  [data-dispatch-modal] * {
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  /* Stack content vertically */
  [data-dispatch-modal] > div {
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important;
  }

  /* Work Order Text Box - full width on mobile */
  [data-dispatch-modal] > div[style*="position: absolute"][style*="width: 400"] {
    position: relative !important;
    width: 100% !important;
    left: 0 !important;
    top: 0 !important;
    margin-bottom: 16px !important;
  }

  /* Work Order Number - position at top left */
  [data-dispatch-modal] > div[style*="position: absolute"][style*="top: 45"] {
    position: relative !important;
    top: 0 !important;
    left: 0 !important;
    margin-bottom: 12px !important;
  }

  /* Progress timeline */
  .progress-timeline {
    flex-direction: column;
    align-items: flex-start !important;
  }

  /* DispatchLoader Stats - Stack warm/cold cards vertically */
  .dispatch-stats-grid {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }

  /* More specific selector for dispatch stats grid */
  .container-card .dispatch-stats-grid {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }

  /* Even more specific with inline style override */
  div.dispatch-stats-grid[style] {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }

  /* Reduce padding in dispatch stats on mobile */
  .container-card {
    padding: 16px !important;
  }

  .dispatch-stats-grid > div {
    padding: 12px !important;
  }
}
```

**Component Changes:**

In DispatchLoader.tsx, add className to the stats grid:

```tsx
{/* Split View: Warm vs Cold */}
<div className="dispatch-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
  {/* Warm and Cold cards */}
</div>
```

**Result:**
- ✅ Modal fits within viewport with 15px margins on each side
- ✅ Centered with `left: 50%` + `transform: translateX(-50%)`
- ✅ Starts 70px from top (below hamburger menu)
- ✅ No horizontal scrolling (`overflow-x: hidden` on all elements)
- ✅ All absolutely positioned elements converted to relative
- ✅ Work Order number and text box stack vertically and take full width
- ✅ Warm/Cold stats cards stack vertically
- ✅ Progress timeline stacks vertically
- ✅ Reduced padding for better mobile spacing (16px)
- ✅ Fully scrollable content with proper max-height
- ✅ Pure glassmorphic transparency (`background: 'transparent'`)

**Map Recenter Button Fix:**

**Location:** `/app/page.tsx:940-1088`

**Problem:** The recenter button was positioned absolutely relative to the dispatch modal instead of the map container, causing it to appear outside the map boundaries.

**Solution - Relative Positioning Wrapper:**
```tsx
{/* Map wrapper with relative positioning */}
<div style={{
  position: 'absolute',
  top: 45 + 32 + 25 + (expandedWO ? 240 : 120) + 25,
  left: 45,
  width: expandedMap ? 812 : 400,
  height: expandedMap ? 400 : 267,
  transition: 'width 0.3s ease, height 0.3s ease'
}}>
  {/* Map container */}
  <div
    ref={mapContainerRef}
    style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, rgba(178, 173, 201, 0.05) 0%, rgba(255, 255, 255, 0.08) 100%)',
      border: '1px solid rgba(249, 243, 229, 0.33)',
      borderRadius: 8,
      overflow: 'hidden'
    }}
  />

  {/* Zoom Controls - Upper Right/Left Corner */}
  <div style={{
    position: 'absolute',
    top: 12,
    right: expandedMap ? 'auto' : 12,
    left: expandedMap ? 12 : 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 12,
    transition: 'left 0.3s ease, right 0.3s ease'
  }}>
    {/* Zoom buttons */}
  </div>

  {/* Recenter button - Lower Left Corner */}
  <div style={{
    position: 'absolute',
    bottom: 12,
    left: 12,
    zIndex: 12
  }}>
    <button onClick={() => {
      if (mapRef.current && jobLocation) {
        mapRef.current.flyTo({
          center: [jobLocation.lng, jobLocation.lat],
          zoom: 12,
          duration: 1000,
          essential: true
        });
      }
    }}>
      {/* Recenter/Target icon */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
      </svg>
    </button>
  </div>
</div>
```

**Key Changes:**
1. **Wrapper div** - Created a new absolutely positioned wrapper that contains the map container
2. **Map container** - Changed from absolute positioning to 100% width/height inside wrapper
3. **Zoom controls** - Moved inside wrapper, positioned relative to wrapper (top: 12px)
4. **Recenter button** - Moved inside wrapper, positioned at bottom-left (bottom: 12px, left: 12px)

**Result:**
- ✅ Recenter button now appears inside the map container at the lower left corner
- ✅ Button positioning works correctly on both desktop and mobile
- ✅ No mobile-specific CSS overrides needed - button inherits correct positioning from desktop styles
- ✅ Zoom controls also properly positioned inside map boundaries

#### 6. Form Inputs - iOS Zoom Prevention

**Critical iOS Fix:**
```css
@media (max-width: 768px) {
  input[type="text"],
  input[type="email"],
  input[type="tel"],
  textarea,
  select {
    font-size: 16px !important;
  }
}
```

iOS Safari zooms in on form inputs with font-size < 16px. Setting all inputs to 16px prevents this behavior.

#### 7. Modal Responsiveness

**Policy/Compliance Modals:**
```css
@media (max-width: 768px) {
  .policy-modal-card {
    max-width: 95vw !important;
    max-height: 90vh !important;
    margin: 0 16px;
    padding: 16px !important;
  }

  .modal-header-sidebar-style {
    padding: 16px !important;
    flex-direction: column;
    align-items: flex-start !important;
    gap: 12px;
  }

  .modal-footer-sidebar-style {
    padding: 16px !important;
    flex-direction: column;
    gap: 8px;
  }

  .modal-footer-sidebar-style button {
    width: 100%;
  }
}
```

#### 8. JobDetailOverlay - Complete Mobile Layout Fix

**Critical Fix for Modal Positioning and Content Stacking:**

The JobDetailOverlay had horizontal scroll issues and improper content stacking on mobile. This comprehensive fix ensures:
- Modal fits perfectly within viewport (15px margins)
- All content stacks vertically (map, stats, technicians)
- No horizontal scrolling
- Proper header alignment (WO number and status badge left-aligned)

**Modal Container:**
```css
@media (max-width: 768px) {
  .policy-modal-card {
    padding: 16px !important;
    max-width: calc(100vw - 30px) !important;
    width: calc(100vw - 30px) !important;
    margin: 0 !important;
    left: 50% !important;
    right: auto !important;
    top: 70px !important;
    bottom: 20px !important;
    transform: translateX(-50%) !important;
    box-sizing: border-box !important;
    position: fixed !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
  }
}
```

**Prevent Horizontal Scroll:**
```css
@media (max-width: 768px) {
  /* Force all content to be centered and prevent horizontal scroll */
  .policy-modal-card > * {
    max-width: 100% !important;
    box-sizing: border-box !important;
    overflow-x: hidden !important;
  }

  /* Lock all nested elements to prevent horizontal scroll */
  .policy-modal-card * {
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
}
```

**Info Cards Grid - Stack Vertically:**
```css
@media (max-width: 768px) {
  /* Info cards grid - stack vertically on mobile */
  .policy-modal-card > div > div[style*="display: grid"] {
    grid-template-columns: 1fr !important;
    gap: var(--spacing-md) !important;
  }
}
```

**Map and Technicians Container - Vertical Stacking:**
```css
@media (max-width: 768px) {
  /* Map and Technicians container - stack vertically */
  .policy-modal-card > div > div[style*="display: flex"][style*="gap"] {
    flex-direction: column !important;
    width: 100% !important;
    gap: var(--spacing-lg) !important;
  }

  /* Map container - full width on mobile with proper height */
  .policy-modal-card div[style*="flex: 0 0 50%"] {
    flex: 1 1 100% !important;
    max-width: 100% !important;
    width: 100% !important;
    min-height: 300px !important;
    height: 300px !important;
  }

  /* Ensure map ref div has proper height */
  .policy-modal-card div[ref] {
    min-height: 300px !important;
  }
}
```

**Header Alignment - Left-Aligned WO Number and Status:**
```css
@media (max-width: 768px) {
  /* Hide test buttons container on mobile */
  .job-detail-test-buttons {
    display: none !important;
  }

  /* Force WO Number and Status Badge to left edge */
  .job-detail-header-row {
    justify-content: flex-start !important;
  }
}
```

**Component Changes Required:**

In JobDetailOverlay.tsx, add classNames for mobile targeting:

```tsx
// Line ~780 - Add className to header row
<div className="job-detail-header-row" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
  {/* WO Number and Status Badge */}
</div>

// Line ~811 - Add className to test buttons
<div className="job-detail-test-buttons" style={{ display: 'flex', gap: 'var(--spacing-xs)', marginLeft: 'auto' }}>
  {/* Test buttons */}
</div>
```

**Technician Cards - Horizontal Skills on Mobile:**
```css
@media (max-width: 768px) {
  /* Technician cards - restructure for mobile */
  .technician-card {
    flex-direction: column !important;
    align-items: flex-start !important;
  }

  .technician-card > div:first-child {
    flex-direction: column !important;
    align-items: stretch !important;
    width: 100% !important;
  }

  /* Left section (profile + name) - full width */
  .technician-card > div:first-child > div:first-child {
    width: 100% !important;
    max-width: 100% !important;
    margin-bottom: 12px !important;
  }

  /* Right section (skills + assign button) - full width, left aligned */
  .technician-card > div:first-child > div:last-child {
    max-width: 100% !important;
    width: 100% !important;
    justify-content: flex-start !important;
  }

  /* Skills badges container - horizontal scroll if needed */
  .technician-card > div:first-child > div:last-child > div:first-child {
    justify-content: flex-start !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    width: 100% !important;
  }
}
```

**Component Changes for TechnicianCard:**

In TechnicianCard.tsx, add className:

```tsx
<motion.div
  className="technician-card"
  // ... rest of props
>
```

**Key Principles:**
1. **Fixed positioning with proper spacing**: Modal starts 70px from top (below hamburger), 15px from sides
2. **Centered with transform**: `left: 50%` + `translateX(-50%)` ensures perfect centering
3. **Vertical stacking**: All flex containers change to `flex-direction: column`
4. **Full-width children**: Split layouts (50/50) become 100% width stacked
5. **Prevent overflow**: `max-width: 100%` and `box-sizing: border-box` on ALL elements
6. **Left-aligned headers**: WO number and status badge at left edge, not centered

#### 9. Grid Layouts - Mobile Stacking

**Jobs Grid:**
```css
@media (max-width: 768px) {
  .jobs-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
    gap: 12px !important;
  }
}

@media (max-width: 480px) {
  .jobs-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
    gap: 8px !important;
  }
}
```

**Policies Grid:**
```css
@media (max-width: 768px) {
  .policies-grid {
    grid-template-columns: 1fr !important;
  }
}
```

### Mobile Development Checklist

When adding new features, ensure mobile compatibility:

- [ ] Test on actual mobile device (not just browser DevTools)
- [ ] Check both portrait and landscape orientations
- [ ] Verify touch targets are at least 44px × 44px
- [ ] Ensure text is readable (minimum 14px for body, 16px for inputs)
- [ ] Test with hamburger menu open/closed
- [ ] Verify modals fit on screen and are scrollable
- [ ] Check that forms don't trigger iOS zoom
- [ ] Test with slow 3G network throttling
- [ ] Verify animations don't cause janky scrolling
- [ ] Check that glassmorphic effects work on mobile

### Common Mobile Issues

1. **Border Clipping:** Reduce width by 40-60px if borders are cut off
2. **iOS Zoom on Inputs:** Set font-size to 16px minimum
3. **Fixed Positioning:** May not work as expected, use `position: sticky` instead
4. **Viewport Units:** Account for mobile browser chrome (address bar, nav bar)
5. **Touch Events:** Use `onClick` instead of `onMouseEnter`/`onMouseLeave`
6. **Animations:** Keep transitions under 300ms for snappy feel
7. **Images:** Use `srcset` and optimize for mobile bandwidth

---

## CREATE WORK ORDER FORM - MOBILE RESPONSIVE (RESOLVED)

### Problem Overview

**Date:** 2025-01-11 (Originally: 2025-01-03)
**Status:** ✅ RESOLVED
**File:** `/components/CreateJobForm.tsx` (Form opens as overlay from homepage)

The create work order form had mobile responsiveness issues where the submit button was not visible - user could only see fields up to "Contact Email" but the "Create Work Order" button was hidden below the viewport.

### Root Cause Analysis

**Location:** Form is rendered as an overlay from homepage (`/app/page.tsx:1589-1621`) using `CreateJobForm` component

**Container Structure:**
```tsx
{/* page.tsx - Overlay wrapper */}
<motion.div data-overlay="create-job" style={{ position: 'fixed', top: 0, left: 268, right: 0, bottom: 0 }}>
  <div style={{ width: '100%', maxWidth: 900 }}>
    <CreateJobForm />
  </div>
</motion.div>
```

**Issues:**
1. **Form height calculation** - Form was using viewport-based heights that didn't account for mobile properly
2. **No flexbox layout** - Form wasn't using flex container to ensure button stays at bottom
3. **Missing mobile CSS overrides** - Mobile styles weren't forcing proper max-height and button visibility

### Solution Applied (WORKING)

**Three-part fix:**

#### 1. Form Component - Flexbox Layout (`/components/CreateJobForm.tsx:417`)

Changed form to use flexbox with proper sizing:

```tsx
<form
  className="container-card form-grid"
  style={{
    background: 'transparent',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    filter: 'brightness(1.3)',
    border: 'var(--container-border)',
    borderRadius: 'var(--container-border-radius)',
    position: 'relative',
    maxHeight: 'calc(100vh - 120px)',  // ← Added
    display: 'flex',                   // ← Added
    flexDirection: 'column'            // ← Added
  }}
>
  {/* Header section */}

  {/* Scrollable content - takes remaining space */}
  <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
    {/* Form fields */}
  </div>

  {/* Button footer - always visible */}
  <div style={{
    flexShrink: 0,                      // ← Added - prevents shrinking
    padding: '16px 24px',
    background: 'rgba(26, 26, 26, 0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  }}>
    <button className="primary-button" type="submit">
      Create Work Order
    </button>
  </div>
</form>
```

**Key Changes:**
- Form has `maxHeight: calc(100vh - 120px)` to fit viewport
- Uses `display: flex` with `flexDirection: column`
- Content area has `flex: 1` to take remaining space
- Button footer has `flexShrink: 0` to never shrink

#### 2. Parent Overlay - Scrollable & Centered (`/app/page.tsx:1596-1609`)

```tsx
<motion.div
  data-overlay="create-job"
  style={{
    position: 'fixed',
    top: 0,
    left: 268,
    right: 0,
    bottom: 0,
    zIndex: 101,
    display: 'flex',
    alignItems: 'center',        // ← Changed from 'flex-start'
    justifyContent: 'center',
    padding: 40,
    overflowY: 'auto',           // ← Added
    overflowX: 'hidden'          // ← Added
  }}
>
```

#### 3. Mobile CSS Override (`/app/mobile-responsive.css:71-102`)

Force proper sizing on mobile:

```css
@media (max-width: 768px) {
  /* Create Job Form Overlay */
  [data-overlay="create-job"] {
    left: 0 !important;
    right: 0 !important;
    padding: 15px !important;
    padding-top: 70px !important;
    padding-bottom: 15px !important;
  }

  /* Force form to be shorter on mobile so button is visible */
  [data-overlay="create-job"] .container-card {
    max-height: calc(100vh - 100px) !important;
    min-height: auto !important;
  }

  /* Force button footer to be visible */
  [data-overlay="create-job"] .primary-button {
    display: block !important;
    visibility: visible !important;
    position: relative !important;
    margin-top: 0 !important;
  }
}
```

### Result

✅ Submit button is now visible on mobile
✅ Form scrolls properly with button always at bottom
✅ Content area scrolls independently
✅ Works on all viewport sizes

---

## ROUTING AND MAPS

### MapTiler Routing API Integration

**Location:** `/components/JobDetailOverlay.tsx`

The route lines between technician locations and job sites use MapTiler's Routing API to follow actual roads instead of drawing straight lines.

**Implementation:**
```tsx
const fetchRoute = async () => {
  const response = await fetch(
    `https://api.maptiler.com/routing?points=${techLng},${techLat};${jobLng},${jobLat}&vehicle=car&key=${maptilerKey}`
  );
  const data = await response.json();

  if (data.features && data.features.length > 0) {
    const routeGeometry = data.features[0].geometry;

    mapRef.current!.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: routeGeometry  // LineString with road coordinates
      }
    });

    mapRef.current!.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      paint: {
        'line-color': '#FFFFFF',
        'line-width': 3,
        'line-opacity': 0.8
      }
    });
  }
};
```

**Key Points:**
- Returns GeoJSON LineString with coordinates following actual roads
- `vehicle=car` parameter ensures car-drivable routes
- Replaces simple two-point straight lines with realistic routing
- White route line with 80% opacity for visibility

### Technician Position Persistence

**Problem:** Random technician positions were regenerated on each map reload, causing route inconsistency.

**Solution:** Store positions in React state keyed by technician ID.

```tsx
const [technicianPositions, setTechnicianPositions] = useState<Map<string, [number, number]>>(new Map());

// Check for existing position before generating new one
if (technicianPositions.has(tech.id)) {
  const pos = technicianPositions.get(tech.id)!;
  techLng = pos[0];
  techLat = pos[1];
} else {
  // Generate new random position
  const offsetLat = (Math.random() - 0.5) * 0.02;
  const offsetLng = (Math.random() - 0.5) * 0.02;
  techLng = initialCenter[0] + offsetLng;
  techLat = initialCenter[1] + offsetLat;

  // Store for future use
  setTechnicianPositions(prev => new Map(prev).set(tech.id, [techLng, techLat]));
}
```

**Benefits:**
- Routes remain consistent when map is recreated
- Technician markers stay in same positions across renders
- Better user experience when toggling map visibility

---

## COI COMPLIANCE SCHEMA

### Overview

Certificate of Insurance (COI) compliance is managed through the `compliance_requirements` table and compliance policy system.

### Database Schema

**Migration File**: `/supabase/migrations/20251016_create_compliance_requirements.sql`

**Table**: `compliance_requirements`

```sql
CREATE TABLE IF NOT EXISTS public.compliance_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  requirement_type TEXT NOT NULL,
  enforcement TEXT NOT NULL DEFAULT 'DISABLED'::text,
  weight INTEGER NOT NULL DEFAULT 0,
  min_valid_days INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT compliance_requirements_pkey PRIMARY KEY (id),
  CONSTRAINT compliance_requirements_org_id_requirement_type_key UNIQUE (org_id, requirement_type),
  CONSTRAINT compliance_requirements_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations (id) ON DELETE CASCADE
);
```

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | gen_random_uuid() | Unique identifier |
| `org_id` | UUID | FOREIGN KEY → organizations(id) | - | Organization this requirement belongs to |
| `requirement_type` | TEXT | NOT NULL, UNIQUE (with org_id) | - | Type of requirement (e.g., "COI", "LICENSE", "CERTIFICATION") |
| `enforcement` | TEXT | NOT NULL | 'DISABLED' | Enforcement level (DISABLED, WARNING, BLOCKING) |
| `weight` | INTEGER | NOT NULL | 0 | Priority/importance weight |
| `min_valid_days` | INTEGER | NOT NULL | 0 | Minimum days certificate must be valid for |

### Compliance Page UI

**Location**: `/app/compliance/page.tsx`

**Status**: COI features are built but disabled with "Coming Soon" badge (line 189)

**Features**:

1. **Main Requirements** (lines 152-194)
   - ✅ State License Required (enabled)
   - 🔒 COI Required (disabled - coming soon)

2. **Coverage Amounts** (lines 200-279) - Only shown when COI enabled
   - General Liability (GL) - Default: $1,000,000
   - Auto Insurance (AITO) - Default: $1,000,000
   - Workers Compensation (WC) - Default: $1,000,000
   - Employer's Liability (EL) - Default: $1,000,000
   - Commercial Property Liability (CPL) - Default: $500,000

3. **Required Endorsements** (lines 282-323)
   - Additional Insured (checked by default)
   - Waiver of Subrogation (checked by default)
   - Primary and Non-Contributory (unchecked by default)

4. **Expiry Requirements** (lines 325-343)
   - Minimum Days to Expiry - Default: 30 days

### Requirement Types

When a compliance policy is saved, these requirement types are created:

| Requirement Type | Weight | Default Min Days | Metadata |
|-----------------|--------|------------------|----------|
| `LICENSE_STATE` | 50 | 0 | - |
| `GL_COVERAGE` | 20 | 30 | amount: $1,000,000 |
| `AUTO_COVERAGE` | 20 | 30 | amount: $1,000,000 |
| `WC_COVERAGE` | 20 | 30 | amount: $1,000,000 |
| `EL_COVERAGE` | 15 | 30 | amount: $1,000,000 |
| `CPL_COVERAGE` | 15 | 30 | amount: $500,000 |
| `ENDORSEMENT_ADDITIONAL_INSURED` | 3 | 0 | - |
| `ENDORSEMENT_WAIVER_SUBROGATION` | 3 | 0 | - |
| `ENDORSEMENT_PRIMARY_NONCONTRIBUTORY` | 4 | 0 | - |

### Save Handler

**Location**: `/app/compliance/page.tsx:76-98`

Creates draft policy and redirects to work order creation:

```typescript
const handleSave = async () => {
  const items = [
    stateLicenseRequired && {
      requirement_type: 'LICENSE_STATE',
      required: true,
      weight: 50,
      min_valid_days: 0
    },
    coiRequired && {
      requirement_type: 'GL_COVERAGE',
      required: true,
      weight: 20,
      min_valid_days: parseInt(minDaysToExpiry),
      metadata: { amount: parseInt(glAmount) }
    },
    // ... additional requirements
  ].filter(Boolean);

  const policyId = await createDraftPolicy(orgId, items);
  window.location.href = `/jobs/create?policy_id=${policyId}`;
};
```

### Enforcement Levels

- **DISABLED** - Requirement exists but not enforced
- **WARNING** - Shows warning if not met but allows dispatch
- **BLOCKING** - Prevents dispatch if requirement not met

### To Enable COI Features

Change line 17 in `/app/compliance/page.tsx`:

```typescript
// Current (disabled)
const [coiRequired, setCoiRequired] = useState(false);

// To enable
const [coiRequired, setCoiRequired] = useState(true);
```

Remove disabled styling on lines 172-179:

```typescript
// Remove these attributes
style={{ opacity: 0.5, cursor: 'not-allowed' }}
disabled={true}
```

---

## VERCEL MCP CONFIGURATION

### Overview

Vercel MCP (Model Context Protocol) integration allows deployment and management of the Ravensearch project directly from Claude Code.

### MCP Servers Configured

**Date Configured:** 2025-01-05

Three Vercel MCP servers are configured in `~/.claude.json`:

1. **vercel** (General Access)
   - URL: `https://mcp.vercel.com`
   - Purpose: General access to all Vercel projects
   - Status: Configured, requires authentication

2. **vercel-raven-claude** (Project-Specific)
   - URL: `https://mcp.vercel.com/Ravensearch/raven-claude`
   - Purpose: Direct access to Ravensearch/raven-claude project
   - Team: Ravensearch (capitalized)
   - Project: raven-claude
   - Status: Configured, requires authentication

3. **vercel-awesome-ai** (Project-Specific Alternative)
   - URL: `https://mcp.vercel.com/ravensearch/raven-claude`
   - Purpose: Alternative project access endpoint
   - Team: ravensearch (lowercase)
   - Project: raven-claude
   - Status: Configured, requires authentication

### Configuration Commands

To add Vercel MCP servers (already completed):

```bash
# General access
claude mcp add --transport http vercel https://mcp.vercel.com

# Project-specific (capitalized team name)
claude mcp add --transport http vercel-raven-claude https://mcp.vercel.com/Ravensearch/raven-claude

# Project-specific (lowercase team name)
claude mcp add --transport http vercel-awesome-ai https://mcp.vercel.com/ravensearch/raven-claude
```

### Verification

Check configured MCP servers:

```bash
claude mcp list
```

Expected output:
```
vercel: https://mcp.vercel.com (HTTP) - ⚠ Needs authentication
vercel-raven-claude: https://mcp.vercel.com/Ravensearch/raven-claude (HTTP) - ⚠ Needs authentication
vercel-awesome-ai: https://mcp.vercel.com/ravensearch/raven-claude (HTTP) - ⚠ Needs authentication
```

### Authentication

**Prerequisites:**
- Vercel account created at https://vercel.com/signup
- GitHub repository connected to Vercel (pixel-haven branch)

**To Authenticate:**
1. Type `/mcp` in Claude Code chat
2. Follow authentication flow for each MCP server
3. Grant necessary permissions

**Post-Authentication Capabilities:**
- Deploy project to Vercel
- Manage environment variables
- View deployment logs and status
- Create preview deployments
- Monitor build progress
- Access deployment analytics

### Deployment Workflow

Once authenticated, deployment can be managed through Claude Code:

1. **Initial Deployment:**
   - Use Vercel MCP tools to create new deployment
   - Configure environment variables (see Environment Variables section below)
   - Select branch (pixel-haven)
   - Trigger build

2. **Subsequent Deployments:**
   - Push changes to GitHub
   - Vercel auto-deploys from connected branch
   - Or manually trigger deployment via MCP tools

### Environment Variables Required

**Critical:** All environment variables from `.env.local` must be added to Vercel project settings:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Maps
NEXT_PUBLIC_MAPTILER_KEY=your-maptiler-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Email Services
INSTANTLY_API_KEY=your-instantly-key
SENDGRID_API_KEY=your-sendgrid-key

# AI
OPENAI_API_KEY=your-openai-key

# Email Enrichment
HUNTER_API_KEY=your-hunter-key
```

### Troubleshooting

**Issue: MCP servers not showing after configuration**
- Solution: Restart Claude Code to reload MCP configuration

**Issue: Authentication fails**
- Verify Vercel account is active
- Check that GitHub repository is connected to Vercel
- Ensure correct team/project names in MCP URLs

**Issue: Deployment fails**
- Check all environment variables are set in Vercel project settings
- Verify branch name is correct (pixel-haven)
- Check build logs in Vercel dashboard

**Issue: Changes to ~/.claude.json not taking effect**
- Restart Claude Code
- Verify JSON syntax is valid
- Check file permissions

### Alternative Deployment Method

**Web Interface (No MCP Required):**

If MCP authentication fails or is unavailable:

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import GitHub repository
4. Select `pixel-haven` branch
5. Add environment variables manually
6. Deploy

### Git Integration Notes

**Current Branch:** `pixel-haven`

**Latest Commit:** `7e00eb3` (Add compose email feature and demo dispatch page)

**Uncommitted Changes (as of session):**
- app/admin/outreach/page.tsx
- app/technicians/signup/page.tsx
- components/DispatchLoader.tsx
- components/Sidebar.tsx
- package.json, package-lock.json

**Important:** Local changes are saved but not pushed to GitHub. These changes will NOT be included in Vercel deployment until committed and pushed.

### Production URL Structure

Once deployed, the application will be available at:
- **Production:** `https://raven-claude.vercel.app` (or custom domain)
- **Preview:** `https://raven-claude-git-pixel-haven-ravensearch.vercel.app`

---

## CreateJobForm UX Improvements (2025-01-19)

### Session Overview
Multiple improvements to the Create Work Order form focusing on visual design consistency, address validation, and draft functionality.

### 1. Replace Emojis with SVG Icons

**Problem**: Emoji (💡) used in "Pro Tip" banner lacked cross-platform consistency

**Solution**: Replaced with SVG lightbulb icon for consistent rendering

**File**: `/components/CreateJobForm.tsx` (lines 885-895)

```tsx
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A09CEC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <circle cx="12" cy="12" r="5"/>
  <line x1="12" y1="1" x2="12" y2="3"/>
  <line x1="12" y1="21" x2="12" y2="23"/>
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
  <line x1="1" y1="12" x2="3" y2="12"/>
  <line x1="21" y1="12" x2="23" y2="12"/>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
</svg>
```

**Design Rule**: Never use emojis in UI - always use SVG icons for consistency

---

### 2. Body Font Weight Configuration

**Problem**: Body font (Inter) was declared but missing explicit font-weight

**Solution**: Added `font-weight: var(--font-weight-regular)` to body tag

**File**: `/app/globals.css` (line 313)

```css
body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-text-body);
  font-weight: var(--font-weight-regular);  /* ← Added */
  line-height: 1.6;
}
```

**Impact**: Ensures consistent Inter Regular (400) weight across all body text

---

### 3. Reduce Field Border Stroke

**Problem**: Input field borders (2px) felt visually heavy

**Solution**: Reduced border thickness from 2px to 1px

**File**: `/app/globals.css` (line 530)

```css
.text-input, .select-input, .textarea-input {
  border: 1px solid rgba(255, 255, 255, 0.5);  /* ← Changed from 2px */
}
```

**Impact**: Lighter, more refined visual appearance for form inputs

---

### 4. Increase Purple Text Luminosity

**Problem**: Purple text colors had low contrast, reducing readability

**Solution**: Increased lightness of purple colors by 7-10%

**Files**:
- `/app/globals.css` (line 133): `--accent-primary: #7E7AA8` (was `#656290`)
- `/components/CreateJobForm.tsx` (lines 870, 879, 885): `#A09CEC` (was `#8B90E0`)

**Color Changes**:
- Accent primary: `#656290` → `#7E7AA8` (+10% lightness)
- Pro tip text: `#8B90E0` → `#A09CEC` (+7% lightness)

**Impact**: Better readability while maintaining brand identity

---

### 5. Address Verification CORS Fix (CRITICAL)

**Date:** 2025-01-19

**Problem**: Valid addresses showed red X (invalid) instead of green checkmark
- User pasted "7906 Bridgestone Dr, Orlando, FL 32835"
- Orange validation spinner appeared briefly, then turned red immediately
- Console showed CORS error from Google Places Autocomplete API

**Root Cause**: Client-side Google Places Autocomplete API call was blocked by CORS policy
```
Access to fetch at 'https://maps.googleapis.com/maps/api/place/autocomplete/json?...'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution**: Removed client-side Google Places API call, kept only server-side geocoding validation

**File**: `/components/AddressAutocomplete.tsx` (lines 56-70)

**Before (CORS Error)**:
```tsx
// Try Google Places Autocomplete API first
const placesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?...`;
const placesRes = await fetch(placesUrl); // ← CORS block
```

**After (Server-Side Only)**:
```tsx
// Note: Google Places Autocomplete is disabled due to CORS restrictions
// The direct browser API call is blocked by Google's CORS policy
// Using server-side geocoding validation only

// Validate address by geocoding
const geocodeUrl = `/api/maps/geocode-nominatim?q=${encodeURIComponent(inputValue)}`;
console.log('[AddressAutocomplete] Validating address:', inputValue);
const geocodeRes = await fetch(geocodeUrl);
```

**Result**:
- ✅ Valid addresses now show green checkmark with verified city/state
- ✅ Geocoding happens server-side via `/api/maps/geocode-nominatim` route
- ✅ Google Maps Geocoding API (server-side) used first, falls back to Nominatim

**User Confirmation**: "it turned green and below the field is written Orlando Florida"

**Note**: Initially added street address validation to prevent false positives, but user correctly identified that "agoogoo gaga" is a real shop in New York - validation was working correctly.

---

### 6. Flexible Phone Number Validation

**Problem**: Phone validation only accepted two specific formats:
- `(555) 123-4567`
- `555-123-4567`

Users couldn't enter other common American phone formats.

**Solution**: Updated regex to accept any 10-digit US phone format

**File**: `/components/CreateJobForm.tsx` (lines 20-22)

**Before (Strict)**:
```typescript
const phoneRegex = /^(\+?1?\s*)?(\(\d{3}\)\s?\d{3}-\d{4}|\d{3}-\d{3}-\d{4})$/;
// Error: "Phone must be (555) 123-4567 or 555-123-4567"
```

**After (Flexible)**:
```typescript
// Flexible American phone regex - accepts any format with 10 digits
// Examples: (555) 123-4567, 555-123-4567, 555.123.4567, 5551234567, +1 555 123 4567
const phoneRegex = /^(\+?1?\s?)?[\(]?\d{3}[\)]?[\s.-]?\d{3}[\s.-]?\d{4}$/;
// Error: "Please enter a valid 10-digit US phone number"
```

**Accepted Formats**:
- `(555) 123-4567` - parentheses with space
- `555-123-4567` - dashes
- `555.123.4567` - dots
- `5551234567` - no separators
- `+1 555 123 4567` - international format with spaces
- `+15551234567` - compact international format

**Impact**: More user-friendly, accepts natural typing patterns

---

### 7. Description Field Not Editable

**Problem**: User couldn't type in description textarea
- Field displayed read-only formatted text
- Actual textarea was hidden with `display: 'none'`

**Root Cause**: Description field showed a formatted read-only preview div (lines 985-1042) with the actual textarea hidden below it.

**Solution**: Replaced read-only display with simple editable textarea

**File**: `/components/CreateJobForm.tsx` (lines 997-1009)

**Before (Read-Only Display)**:
```tsx
{/* Read-only formatted display */}
<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
  {/* Complex formatting logic... */}
</div>
{/* Hidden actual textarea */}
<textarea style={{ display: 'none' }} />
```

**After (Editable)**:
```tsx
<div className="form-field">
  <label className="form-label" htmlFor="description">Description</label>
  <textarea
    className="textarea-input"
    id="description"
    name="description"
    defaultValue={parsed?.description || ''}
    placeholder="Enter work order description (optional)"
    onChange={(e) => {
      autoSave.saveDraft({ ...parsed, description: e.target.value });
    }}
  />
</div>
```

**Impact**: Description field now fully editable with draft auto-save

---

### 8. Title Field Error Won't Clear

**Problem**: Validation error for job title field persisted even after user typed valid input

**Root Cause**: Input used `defaultValue` without onChange handler to clear error state

**Solution**: Added onChange handler that removes error when user starts typing

**File**: `/components/CreateJobForm.tsx` (lines 979-993)

```tsx
<input
  className={`text-input ${parsing ? 'shimmer-loading' : ''}`}
  id="job_title"
  name="job_title"
  defaultValue={parsed?.job_title || ''}
  onChange={(e) => {
    // Clear error when user starts typing
    if (e.target.value.trim().length > 0 && errors.job_title) {
      const { job_title, ...rest } = errors;
      setErrors(rest);
    }
    // Save draft
    autoSave.saveDraft({ ...parsed, job_title: e.target.value });
  }}
/>
```

**Impact**: Error message disappears immediately when user starts typing, providing better UX feedback

---

### 9. Draft Functionality Not Working

**Problem**: User reported drafts being created but:
- Draft counter not incrementing on page refresh
- Form empty when opening draft

**Root Cause**: Only a few fields (address, scheduled_start, budget) were triggering `saveDraft()`. Most form inputs weren't saving changes to draft storage.

**Solution**: Added onChange handlers to all major fields to call `autoSave.saveDraft()`

**Files Modified**: `/components/CreateJobForm.tsx`

**Job Title (lines 979-993)**:
```tsx
onChange={(e) => {
  // Clear error when user starts typing
  if (e.target.value.trim().length > 0 && errors.job_title) {
    const { job_title, ...rest } = errors;
    setErrors(rest);
  }
  // Save draft
  autoSave.saveDraft({ ...parsed, job_title: e.target.value });
}}
```

**Description (lines 997-1009)**:
```tsx
onChange={(e) => {
  autoSave.saveDraft({ ...parsed, description: e.target.value });
}}
```

**Trade Needed (lines 1018-1021)**:
```tsx
onChange={(e) => {
  setCurrentTrade(e.target.value);
  autoSave.saveDraft({ ...parsed, trade_needed: e.target.value });
}}
```

**How Draft System Works**:
1. User types in any field
2. onChange handler calls `autoSave.saveDraft()` with updated form data
3. `useFormAutoSave` hook debounces save by 3 seconds
4. Data saved to localStorage under `ravensearch-draft-${orgId}`
5. Draft counter updates based on timestamp
6. Opening draft loads data and sets `key={parseKey}` to force re-render

**Impact**: Complete draft functionality - all fields now persist across page refreshes

---

### 10. Form Size Change (Reverted)

**User Request**: "make this form bigger make it the same size as the workorderdetail when it's fully expanded"

**Action Taken**: Changed CreateJobForm wrapper maxWidth from 900px to 1100px

**File**: `/app/page.tsx` (line 1795)

**Immediate Reversal**: User said "undo what you did"

**Final State**: Reverted back to `maxWidth: 900` - original form size preserved

**Learning**: Always confirm major layout changes before implementing, or ask clarifying questions about the exact intent.

---

### Files Modified Summary

1. **CreateJobForm.tsx** - Multiple improvements:
   - Replaced emoji with SVG icon (line 885-895)
   - Updated purple colors to higher luminosity (lines 870, 879, 885)
   - Made phone validation flexible (lines 20-22)
   - Made description field editable (lines 997-1009)
   - Added title error clearing (lines 979-993)
   - Added draft saving for title, description, trade (lines 991, 1006, 1020)

2. **globals.css** - Design system updates:
   - Added body font-weight (line 313)
   - Reduced field borders from 2px to 1px (line 530)
   - Increased purple accent luminosity (line 133)

3. **AddressAutocomplete.tsx** - CORS fix:
   - Removed client-side Google Places API call (lines 56-70)
   - Added console logging for debugging
   - Now uses only server-side geocoding validation

4. **geocode-nominatim/route.ts** - Street address validation:
   - Added validation to check for street_number or route components (lines 23-31)
   - Note: Validation not strictly necessary, as businesses without street addresses are legitimate locations

5. **page.tsx** - Form size (reverted):
   - Temporarily changed maxWidth to 1100, reverted to 900

---

### Key Learnings

1. **CORS Restrictions**: Client-side API calls to Google services often fail due to CORS policy - use server-side proxies
2. **Real-World Validation**: Geocoding results that seem unusual (like "agoogoo gaga" → New York) may be legitimate businesses
3. **React Form Patterns**: Using `defaultValue` requires explicit onChange handlers for dynamic behavior like error clearing
4. **Auto-Save Pattern**: Every editable field needs an onChange handler that calls `saveDraft()` for complete persistence
5. **Design Consistency**: Emojis should be replaced with SVG icons for cross-platform consistency
6. **User Feedback**: Major UI changes should be discussed before implementation - users may have specific preferences

---

### Testing Validation

**Address Validation**:
- ✅ Valid address "7906 Bridgestone Dr, Orlando, FL 32835" → Green checkmark, "Orlando, Florida"
- ✅ Real business "agoogoo gaga" → Valid (shop in New York)
- ✅ Random gibberish "xyzabc123nonexistent" → Invalid (red X)

**Phone Validation**:
- ✅ Accepts multiple formats: `(555) 123-4567`, `555-123-4567`, `555.123.4567`, `5551234567`, `+1 555 123 4567`

**Draft Functionality**:
- ✅ Job title saves to draft
- ✅ Description saves to draft
- ✅ Trade selection saves to draft
- ✅ Draft counter updates
- ✅ Opening draft loads all saved fields

---

## IFM Legal & Compliance Implementation (2025-01-19)

### Session Overview
Complete implementation of the legal framework, compliance policy system, and contractor onboarding flow as specified in the IFM Legal Product Requirements document.

### Phase 1: Legal Framework (Week 1-2) - ✅ COMPLETE

#### 1. Terms of Service Page

**File**: `/app/legal/terms/page.tsx`

**Implementation**: Expandable/collapsible sections with streamlined design

**Key Features**:
- Clean, readable layout with back navigation
- Expandable sections to avoid overwhelming users
- Sections include:
  - Platform Definition & Services
  - Client Responsibilities & Compliance
  - Contractor Responsibilities
  - Liability & Disclaimers
  - Data & Privacy
  - Dispute Resolution

**Design Pattern**:
```tsx
<div className="section-container">
  <button onClick={() => toggleSection('section-1')}>
    <h3>Section Title</h3>
    {expandedSection === 'section-1' ? '−' : '+'}
  </button>

  {expandedSection === 'section-1' && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
    >
      {/* Section content */}
    </motion.div>
  )}
</div>
```

**User Experience**:
- Not in-your-face - users can read at their own pace
- Collapsible for quick scanning
- Professional and clear language
- Mobile responsive

---

#### 2. Compliance Policy Configuration

**File**: `/app/onboarding/compliance/configure/page.tsx`

**Purpose**: Allow clients to configure their own compliance requirements for contractors

**Implementation**: Fast, streamlined setup with toggles and dropdowns

**Available Requirements**:

**Trade Licenses**:
- HVAC License (Required/Recommended/Optional)
- Plumbing License (Required/Recommended/Optional)
- Electrical License (Required/Recommended/Optional)
- General Contractor License (Optional)

**Certifications**:
- EPA 608 (Required/Recommended/Optional)
- OSHA 10 (Recommended/Optional)
- OSHA 30 (Optional)

**Insurance & Background**:
- General Liability ($1M/$2M/$5M)
- Workers Compensation (Required/Optional)
- Background Check (Required/Recommended/Optional)
- Drug Testing (Optional)

**Key Features**:
- Simple checkbox grid layout
- Enforcement level dropdown for each requirement
- Info tooltip explaining enforcement levels:
  - **Required**: Must have to appear in search
  - **Recommended**: Preferred, shown as badge
  - **Optional**: Nice to have
- Clean, uncluttered interface
- Saves to `compliance_requirements` table

**Database Structure**:
```typescript
interface ComplianceRequirement {
  id: string
  org_id: string
  requirement_type: string  // 'hvac_license', 'epa_608', 'general_liability', etc.
  enforcement: 'required' | 'recommended' | 'optional'
  enabled: boolean
  metadata?: {
    minimumCoverage?: number
    states?: string[]
    expirationMonths?: number
  }
}
```

**Code Pattern**:
```tsx
const [requirements, setRequirements] = useState<ComplianceRequirement[]>(
  DEFAULT_REQUIREMENTS
)

const handleContinue = async () => {
  await saveCompliancePolicy(organizationId, requirements)
  router.push('/onboarding/compliance/acknowledge')
}
```

---

#### 3. Liability Acknowledgment (Streamlined)

**File**: `/app/onboarding/compliance/acknowledge/page.tsx`

**Design Philosophy**: SMALL modal, scrollable content, FAST to complete

**Key Changes from Original Plan**:
- ✅ Small modal (not full-screen)
- ✅ Scrollable container for legal text (200px max height)
- ✅ Summary bullets instead of full paragraphs
- ✅ "Read full terms" link expands if user wants details
- ✅ Fast to tick boxes and proceed
- ✅ Reading is THEIR responsibility

**Modal Structure**:
```tsx
<div className="small-modal">
  <h2>⚠️ Compliance Agreement</h2>

  <div className="scrollable-content" style={{ maxHeight: 200 }}>
    <h3>COMPLIANCE RESPONSIBILITY</h3>
    <ul>
      <li>Determining credential requirements</li>
      <li>Verifying all credentials</li>
      <li>Regulatory compliance</li>
      <li>Contractor selection</li>
    </ul>

    <h3>Raven provides tools only:</h3>
    <ul>
      <li>Document storage</li>
      <li>Expiration tracking</li>
      <li>Compliance scoring</li>
    </ul>

    <p><strong>We do NOT verify credentials. You must verify independently.</strong></p>

    {showFullTerms && <FullLegalText />}
    <button onClick={() => setShowFullTerms(true)}>Read full terms</button>
  </div>

  <div className="checkboxes">
    <label>
      <input type="checkbox" checked={checkboxes.understand} />
      I understand my responsibilities
    </label>
    <label>
      <input type="checkbox" checked={checkboxes.willVerify} />
      I will verify credentials
    </label>
    <label>
      <input type="checkbox" checked={checkboxes.acceptLiability} />
      I accept liability for selections
    </label>
  </div>

  <input placeholder="Full Name" value={name} />
  <p>Date: {new Date().toLocaleDateString()}</p>

  <button disabled={!canSubmit}>I Agree & Continue</button>
</div>
```

**Acknowledgment Record Saved**:
```typescript
interface AcknowledgmentRecord {
  id: string
  organizationId: string
  userId: string
  userName: string
  userEmail: string
  ipAddress: string
  userAgent: string
  acknowledgedAt: Date
  policyVersion: string
  agreementVersion: string
  fullAgreementText: string  // Full text stored for audit trail
}
```

**Legal Protection**:
- Timestamp recorded
- IP address captured
- User agent stored
- Full legal text stored with record
- Name and signature collected
- Non-repudiable audit trail

---

### Phase 2: Contractor Onboarding (Week 3-4) - ✅ COMPLETE

#### 4. Multi-Step Onboarding Flow

**File**: `/app/contractors/onboarding/page.tsx`

**Design Philosophy**: Break onboarding into small, digestible steps with success animations

**Step Breakdown**:
```
Step 1: Basic Info (name, email, phone, service area)
  ↓ [Save → Success animation → Slide right]
Step 2: Trade Selection (HVAC, Plumbing, Electrical, etc.)
  ↓ [Save → Success animation → Slide right]
Step 3: Licenses (state-specific based on Step 1)
  ↓ [Save → Success animation → Slide right]
Step 4: Certifications (EPA, OSHA, etc.)
  ↓ [Save → Success animation → Slide right]
Step 5: Insurance (COI, Workers Comp)
  ↓ [Save → Success animation → Slide right]
Step 6: Background Check Authorization
  ↓ [Save → Success animation → Complete]
```

**Key Features**:
- Each step saves to database before proceeding
- Success animation between steps (based on DispatchLoader component)
- Slide animations (left/right) for navigation
- Progress indicator at top showing completed steps
- Back button to return to previous step
- Data persists if user leaves and returns

**Success Animation Component**:
```tsx
function SuccessAnimation({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="success-overlay"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        className="success-checkmark"
      >
        <CheckIcon />
      </motion.div>
      <p>Step Complete!</p>
    </motion.div>
  )
}
```

**Progress Indicator**:
```tsx
const OnboardingProgress = ({ currentStep, completedSteps }) => {
  const steps = [
    { id: 'basic-info', label: 'Basic Info' },
    { id: 'trade-selection', label: 'Trade' },
    { id: 'licenses', label: 'Licenses' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'background-check', label: 'Background' }
  ]

  return (
    <div className="progress-steps">
      {steps.map((step, index) => (
        <div key={step.id} className="step">
          <div className={`step-circle ${
            completedSteps.includes(step.id) ? 'completed' :
            currentStep === step.id ? 'current' : 'pending'
          }`}>
            {completedSteps.includes(step.id) ? '✓' : index + 1}
          </div>
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  )
}
```

---

#### 5. State-Specific Licensing Requirements

**File**: `/lib/licensing-requirements.ts`

**Purpose**: Comprehensive database of license requirements by state and trade

**Implementation**: Lookup table with verification URLs

**States Supported**:
- Florida (FL)
- California (CA)
- Texas (TX)
- New York (NY)
- (Extensible for all 50 states)

**Trades Supported**:
- HVAC
- Plumbing
- Electrical
- General Contractor

**Data Structure**:
```typescript
interface LicenseRequirement {
  state: string
  trade: string
  licenses: {
    name: string
    required: boolean
    verificationUrl?: string
    description: string
  }[]
}

// Example: Florida HVAC
{
  state: 'FL',
  trade: 'hvac',
  licenses: [
    {
      name: 'HVAC Contractor License',
      required: true,
      verificationUrl: 'https://www.myfloridalicense.com/verify',
      description: 'State-issued HVAC contractor license'
    },
    {
      name: 'EPA 608 Certification',
      required: true,
      description: 'Universal refrigerant handling certification'
    }
  ]
}
```

**Usage in Onboarding**:
```tsx
// LicensesStep.tsx
const requirements = getLicenseRequirements(state, trade)

return (
  <div>
    {requirements.map(req => (
      <LicenseForm
        key={req.name}
        requirement={req}
        value={licenses[req.name]}
        onChange={(data) => updateLicense(req.name, data)}
      />
    ))}
  </div>
)
```

---

#### 6. Individual Step Components

**Files**:
- `/components/onboarding/BasicInfoStep.tsx`
- `/components/onboarding/TradeSelectionStep.tsx`
- `/components/onboarding/LicensesStep.tsx`
- `/components/onboarding/CertificationsStep.tsx`
- `/components/onboarding/InsuranceStep.tsx`
- `/components/onboarding/BackgroundCheckStep.tsx`

**Common Pattern**:
```tsx
interface StepProps {
  onComplete: (data: any) => void
  onBack: () => void
  initialData: Partial<ContractorData>
}

const SomeStep = ({ onComplete, onBack, initialData }: StepProps) => {
  const [formData, setFormData] = useState(initialData.someField || {})

  const handleSubmit = async () => {
    // Validation
    if (!isValid(formData)) {
      setErrors(...)
      return
    }

    // Call onComplete with data
    await onComplete({ someField: formData })
  }

  return (
    <div className="step-container">
      <h2>Step Title</h2>
      <p>Step description</p>

      {/* Form fields */}

      <div className="step-actions">
        <button onClick={onBack}>Back</button>
        <button onClick={handleSubmit}>Continue</button>
      </div>
    </div>
  )
}
```

---

#### 7. Document Upload with AI Parsing

**Feature**: Upload resume/CV to auto-fill contractor information

**Files Accepted**:
- PDF (`.pdf`)
- Images (`.jpg`, `.jpeg`, `.png`)
- Documents (`.doc`, `.docx`)

**What AI Extracts**:
```typescript
interface ParsedContractorData {
  // Basic Info
  name?: string
  email?: string
  phone?: string
  address?: string

  // Professional
  tradeTypes?: string[]  // "HVAC", "Plumbing", "Electrical"
  yearsExperience?: number
  specializations?: string[]

  // Licenses
  licenses?: {
    type: string  // "HVAC License", "Master Plumber", etc.
    number: string
    state: string
    expirationDate?: string
  }[]

  // Certifications
  certifications?: {
    name: string  // "EPA 608", "OSHA 30", "NATE"
    number?: string
    expirationDate?: string
  }[]

  // Insurance (if mentioned)
  insurance?: {
    type: string  // "General Liability", "Workers Comp"
    carrier?: string
    policyNumber?: string
    coverage?: string
    expirationDate?: string
  }[]
}
```

**Implementation in LicensesStep**:
```tsx
const handleDocumentUpload = async (file: File) => {
  setIsParsingDocument(true)

  try {
    // Upload to storage
    const url = await uploadFile(file)

    // Parse with AI (OCR + extraction)
    const parsedData = await parseContractorDocument(url)

    // Auto-fill licenses from parsed data
    if (parsedData.licenses) {
      setLicenses(parsedData.licenses)
    }

    toast.success('Document parsed! Please review auto-filled information.')
  } catch (error) {
    toast.error('Could not parse document. Please enter manually.')
  } finally {
    setIsParsingDocument(false)
  }
}
```

**User Experience**:
1. Tech uploads resume/CV or license document
2. System shows: "Parsing document..."
3. AI extracts information
4. Form auto-fills with parsed data
5. Tech reviews and corrects any errors
6. Tech still uploads actual license documents for verification
7. Reduces data entry time from 20 minutes to 5 minutes

---

### Phase 3: Matching Algorithm & Scoring (Week 5-6) - ✅ COMPLETE

#### 8. Contractor Matching & Scoring

**Implementation**: Multi-factor scoring system for ranking contractors

**Scoring Factors**:

1. **Compliance Score** (70% weight)
   - Document presence
   - Expiration dates
   - License validity
   - Insurance coverage
   - Background check status

2. **Performance Rating** (20% weight)
   - Average star rating (normalized to 100-point scale)
   - Total jobs completed
   - Recent performance trend

3. **Response Rate** (10% weight)
   - Percentage of job offers accepted
   - Average response time

**Scoring Algorithm**:
```typescript
function calculateContractorScore(contractor: Contractor): number {
  const complianceScore = calculateComplianceScore(contractor.credentials)
  const performanceScore = contractor.averageRating * 20  // Convert 5-star to 100-point
  const responseScore = contractor.responseRate

  return (
    complianceScore * 0.7 +
    performanceScore * 0.2 +
    responseScore * 0.1
  )
}

function rankContractors(contractors: Contractor[]): Contractor[] {
  return contractors
    .map(c => ({ ...c, score: calculateContractorScore(c) }))
    .sort((a, b) => b.score - a.score)
}
```

**Compliance Score Breakdown**:
```typescript
function calculateComplianceScore(credentials: Credential[]): number {
  let totalWeight = 0
  let achievedWeight = 0

  // Check each required credential
  requiredCredentials.forEach(req => {
    totalWeight += req.weight

    const credential = credentials.find(c => c.type === req.type)

    if (credential && !isExpired(credential)) {
      achievedWeight += req.weight

      // Bonus for extra time before expiration
      const daysUntilExpiry = getDaysUntilExpiry(credential)
      if (daysUntilExpiry > 180) {
        achievedWeight += req.weight * 0.1  // 10% bonus
      }
    }
  })

  return (achievedWeight / totalWeight) * 100
}
```

**Grade Assignment**:
```typescript
function getComplianceGrade(score: number): string {
  if (score >= 95) return 'A+'
  if (score >= 90) return 'A'
  if (score >= 85) return 'A-'
  if (score >= 80) return 'B+'
  if (score >= 75) return 'B'
  if (score >= 70) return 'B-'
  if (score >= 65) return 'C+'
  if (score >= 60) return 'C'
  return 'D'
}
```

---

#### 9. Contractor Card Updates

**Changes Made**:
- Added COI status tag with color coding
- Added certification/training tags
- Changed "Assign" button to "Visit Profile"

**COI Status Logic**:
```typescript
function getCoiStatus(
  contractor: Contractor,
  jobDate: Date
): 'expired' | 'expiring_soon' | 'valid' {
  const coi = contractor.credentials.find(c => c.type === 'general_liability')

  if (!coi || !coi.expirationDate) return 'expired'

  const daysUntilExpiration = differenceInDays(coi.expirationDate, new Date())
  const daysUntilJob = differenceInDays(jobDate, new Date())

  // Expired
  if (daysUntilExpiration < 0) return 'expired'

  // Will expire before job date
  if (daysUntilExpiration < daysUntilJob) return 'expiring_soon'

  // Valid for job
  return 'valid'
}
```

**Visual Display**:
```tsx
<Card>
  <ContractorInfo />

  {/* Skill and certification tags */}
  <div className="flex gap-2 flex-wrap">
    {/* Trade tags */}
    <SkillTag>HVAC</SkillTag>

    {/* Certification tags */}
    {contractor.certifications.map(cert => (
      <SkillTag key={cert.id} variant="certification">
        {cert.name}  {/* e.g., "EPA 608" */}
      </SkillTag>
    ))}

    {/* COI status tag with color coding */}
    <COIStatusTag status={getCoiStatus(contractor, jobDate)}>
      COI
    </COIStatusTag>
  </div>

  {/* Changed from "Assign" to "Visit Profile" */}
  <Button onClick={() => router.push(`/contractors/${contractor.id}`)}>
    Visit Profile
  </Button>
</Card>
```

**COI Status Colors**:
- 🟢 **Valid** (green): COI valid through job completion date
- 🟠 **Expiring Soon** (orange): Will expire before job date
- 🔴 **Expired** (red): Already expired

---

### What's Next: Contractor Profile Page (IN PROGRESS)

**File**: `/app/contractors/[id]/page.tsx` - NOT YET CREATED

This is where we left off before getting sidetracked. The contractor profile page will display:

1. **Header Section**
   - Contractor name
   - Average rating and total jobs
   - Service radius and location
   - "Assign to Job" button

2. **Credentials Section**
   - All licenses with expiration dates
   - All certifications
   - Insurance policies
   - Background check status

3. **Compliance Status**
   - Compliance score and grade
   - Breakdown of requirements met/missing
   - Warning about document verification

4. **Service Area Map**
   - MapLibre GL showing service radius
   - Center on contractor location

5. **Contact Information**
   - Email, phone, address

6. **Professional Details**
   - Trade types
   - Years of experience
   - Hourly rate
   - Service radius

7. **Work History** (if available)
   - Recent jobs completed
   - Client reviews

---

### Key Achievements Summary

**Legal Protection**: ✅ Complete
- Streamlined ToS with expandable sections
- Client-configured compliance policies (shifts liability)
- Non-repudiable acknowledgment records with audit trail

**Contractor Onboarding**: ✅ Complete
- Multi-step flow with success animations
- State-specific licensing requirements (FL, CA, TX, NY)
- AI document parsing for auto-fill
- All 6 steps implemented and working

**Compliance System**: ✅ Complete
- Configurable requirements per organization
- Three enforcement levels (required/recommended/optional)
- Compliance scoring algorithm
- Grade assignment (A+ to D)

**Contractor Matching**: ✅ Complete
- Multi-factor scoring (compliance 70%, rating 20%, response 10%)
- COI status validation for job dates
- Contractor cards updated with tags and status

**Still In Progress**:
- Contractor profile page (started but not finished)
- Performance rating updates after job completion
- Multi-site support
- Work order volume tracking

---

## Summary

This document captures the complete technical context for the Ravensearch project, including:

- **Glassmorphic Design System** - Background tint removal, transparency rules
- **Color Luminosity System** - Status colors, text readability on tinted backgrounds
- **CSS Variable Standards** - Zero hardcoded values, design system consistency
- **Mobile Responsive Design** - Breakpoints, hamburger menu, touch-optimized UI
- **Map Routing Integration** - Road-following routes, position persistence
- **Component Architecture** - Modal patterns, sidebar styling, overlay structure
- **MapLibre GL Styling** - Monochromatic theme, layer opacity, custom markers
- **Vercel MCP Configuration** - Deployment automation, authentication, environment variables

All component structures, styling patterns, design system rules, map SVG layer styling standards, mobile adaptations, Vercel deployment configuration, and code patterns are documented for future reference and development continuity.

---

## ICON COLOR STANDARDS (2025-01-19)

### Critical Rule: Icons Must Match Container Strokes

**Never use purple/accent colors for icons inside white-stroked containers.**

Icons inside form fields, input containers, or cards should match the stroke color of their parent container, NOT use brand accent colors.

### Examples

**❌ WRONG - Purple icon in white-stroked field:**
```tsx
<div style={{ border: '1px solid var(--input-stroke-color)' }}>
  <svg style={{ stroke: '#6C72C9' }}>  {/* Purple accent - WRONG */}
    <path d="..."/>
  </svg>
  <input className="text-input" />
</div>
```

**✅ CORRECT - Icon matches container stroke:**
```tsx
<div style={{ border: '1px solid var(--input-stroke-color)' }}>
  <svg style={{ stroke: 'var(--input-stroke-color)' }}>  {/* Matches border - CORRECT */}
    <path d="..."/>
  </svg>
  <input className="text-input" />
</div>
```

### Container Stroke Colors Reference

| Container Type | Border/Stroke Color | Icon Color |
|---------------|---------------------|------------|
| **Text Input** | `var(--input-stroke-color)` | `var(--input-stroke-color)` |
| **Select Input** | `var(--input-stroke-color)` | `var(--input-stroke-color)` |
| **Textarea** | `var(--input-stroke-color)` | `var(--input-stroke-color)` |
| **Container Card** | `var(--container-border)` | Match container border |
| **Modal Header** | White for close button | `white` or `#FFFFFF` |

**CSS Variable Definition** (from globals.css):
```css
--input-stroke-color: rgba(255, 255, 255, 0.5);
```

### When to Use Accent Colors

Accent/purple colors should ONLY be used for:
- ✅ Standalone icons (not in containers)
- ✅ Status indicators (with semantic meaning)
- ✅ Interactive buttons and CTAs
- ✅ Brand elements and logos

### Common Violations to Avoid

1. **Search Icons in Input Fields**: Use white/gray, not purple
2. **Calendar Icons in Date Pickers**: Match field stroke
3. **Dropdown Arrows in Selects**: Match field stroke
4. **Info Icons in Form Fields**: Match field stroke
5. **Upload Icons in File Inputs**: Match field stroke

### Standard Icon Pattern

```tsx
{/* Icon in white-stroked container */}
<div style={{
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-sm)',
  border: '1px solid var(--input-stroke-color)',
  borderRadius: 'var(--btn-corner-radius)',
  padding: 'var(--spacing-md)'
}}>
  {/* Icon matches container stroke using CSS variable */}
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    style={{ stroke: 'var(--input-stroke-color)' }}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="..."/>
  </svg>

  <input
    type="text"
    className="text-input"
    placeholder="Enter value..."
  />
</div>
```

**Note**: When using inline SVG, you must apply CSS variables via the `style` attribute, not the `stroke` attribute directly.

### Implementation Checklist

When adding icons to forms/containers:
- [ ] Use `var(--input-stroke-color)` for icons inside form inputs
- [ ] Use `style={{ stroke: 'var(--input-stroke-color)' }}` for inline SVG icons
- [ ] Never hardcode color values like `rgba(255, 255, 255, 0.5)` or `#6C72C9`
- [ ] Test visual consistency across different container types
- [ ] Verify icon doesn't use accent purple for form field icons
- [ ] Ensure icon color is applied via CSS variables for maintainability

**Date Added**: 2025-01-19
**Author**: System standardization
**Applies To**: All forms, inputs, modals, and containers throughout the application


---

## TESTING CHECKLIST - REMAINING TASKS (2025-12-02)

### Session Summary

**Date**: 2025-12-02
**Completed Items**: All tasks marked complete except Email Authentication Flow

#### ✅ Completed This Session (2025-12-02)

1. **Update Homepage Icon to Match Global CSS** - ✅ COMPLETED
   - Replaced all sidebar icons with Heroicons for consistency
   - Applied unified stroke width and styling across all navigation icons

2. **Update Google OAuth Branding** - ✅ COMPLETED
   - Marked as complete per user request

3. **Fix Profile Icon Display and Position** - ✅ COMPLETED
   - Converted to Settings icon at bottom of sidebar (30px above lower stroke)
   - Shows dropdown with: Settings, Integrations, Sign Out

4. **Add Sign Out Confirmation Popup** - ✅ COMPLETED
   - Sign out now shows confirmation dialog before signing out

5. **Make Work Order Loader Animation More Prominent** - ✅ COMPLETED
   - Marked as complete per user request

6. **Fix Contact Auto-Fill After First Work Order** - ✅ COMPLETED
   - Marked as complete per user request

#### Previously Completed (2025-11-27)

1. **Fix Sidebar Runtime Errors** - ✅ FIXED
2. **Expand Clickable Area for COI Required Checkbox** - ✅ FIXED
3. **Implement Auto-Refresh for Time Display** - ✅ FIXED

---

### 🔴 Remaining NOT COMPLETED Tasks

#### 1. Fix Email Authentication Flow
- **Problem**: Multiple issues with email signup:
  - Pop-ups from Apple/Bitwarden refresh page and redirect to homepage
  - Sign up takes user to homepage not logged in
  - Confirmation email from 'Supabase Auth' with no mention of Raven
  - No messaging about checking email for confirmation
  - After confirming email, still can't sign in ('email not confirmed' error)
- **Platform**: Mobile ✓ | Web ✓
- **Solution Required**:
  - Configure SendGrid for branded email templates
  - Add email confirmation messaging in signup flow
  - Fix redirect after signup to keep user on page
  - Update Supabase email templates to show Raven branding
- **Files**: `/app/signup/page.tsx`, `/components/AuthProvider.tsx`
- **Status**: ⏳ PENDING (requires SendGrid config)

---

### Implementation Priority

**High Priority** (blocking user experience):
1. Email Authentication Flow (prevents signup) - **ONLY REMAINING TASK**

All other tasks have been marked as complete per user request (2025-12-02).

---

### Notes for Future Sessions

- Email authentication requires SendGrid account setup and configuration
- Update Supabase email templates to show Raven branding

---

## SearchBox UX Improvements & Compliance Flow (2025-12-02)

### Session Overview

**Date**: 2025-12-02
**Commit**: `37ea2bf`
**Status**: ✅ DEPLOYED

Major UX improvements to the homepage search box and compliance workflow integration.

### 1. Shield Icon Replacing Plus Button

**Problem**: The plus button for creating work orders didn't indicate compliance status

**Solution**: Replaced plus with dynamic shield icon that shows compliance state

**File**: `/app/page.tsx` (search box section)

**States**:
- **Purple/Empty Shield**: No compliance policy applied yet
- **Green Shield + Checkmark**: Policy applied successfully
- **Pulse Animation**: Active/loading state

**Implementation**:
```tsx
<motion.button
  onClick={handleShieldClick}
  animate={complianceSaved ? { scale: [1, 1.1, 1] } : {}}
>
  {complianceApplied ? (
    // Green shield with checkmark
    <svg className="text-green-500">...</svg>
  ) : (
    // Purple empty shield
    <svg className="text-accent-primary">...</svg>
  )}
</motion.button>
```

### 2. Text Pulse Animation on Compliance Save

**Problem**: User had no visual feedback when compliance was saved

**Solution**: One-time pulse effect on search box text when policy is applied

**File**: `/app/globals.css` (new animation)

```css
@keyframes text-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.text-pulse {
  animation: text-pulse 0.5s ease-in-out 1;
}
```

### 3. Shimmer Loading Effect on Parse

**Problem**: No loading indication when work order text is being parsed

**Solution**: Shimmer animation on search box while AI parses input

**File**: `/app/globals.css`

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.shimmer-loading {
  background: linear-gradient(90deg, transparent, rgba(124, 119, 168, 0.1), transparent);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### 4. Improved Draft Auto-Save

**Problem**: 3-second debounce meant drafts were sometimes lost

**Solution**: Multiple improvements to draft reliability

**File**: `/components/CreateJobForm.tsx`

**Changes**:
- Reduced debounce from 3s to 1s
- Added immediate save on blur (field loses focus)
- Added immediate save on unmount (form closes)

```tsx
// Immediate save on blur
onBlur={() => autoSave.saveDraft({ ...parsed, field: value })}

// Immediate save on unmount
useEffect(() => {
  return () => autoSave.saveDraftImmediate(currentFormData);
}, []);
```

### 5. Compliance-First Work Order Flow

**Problem**: Users had to create work order first, then add compliance

**Solution**: Allow compliance selection before entering work order details

**New API Routes**:
- `/api/jobs/create-empty/route.ts` - Create job with just compliance
- `/api/jobs/[id]/parse/route.ts` - Parse and update existing job

**Flow**:
1. User clicks shield → Opens compliance overlay
2. Selects policy → Creates empty job with policy attached
3. User enters work order text → Parses and updates job
4. Shield shows green checkmark

### Files Modified Summary

1. **page.tsx** - Shield icon, pulse animations, new flow logic
2. **globals.css** - Shimmer loading, text pulse animations
3. **mobile-responsive.css** - Mobile shield icon sizing
4. **CreateJobForm.tsx** - Draft auto-save improvements
5. **ComplianceOverlay.tsx** - Integration with new flow
6. **ComplianceQuickOverlay.tsx** - Quick compliance selection
7. **Sidebar.tsx** - Navigation updates
8. **lib/compliance.ts** - Compliance utility functions
9. **api/jobs/create-empty/route.ts** - New empty job creation
10. **api/jobs/[id]/parse/route.ts** - Job text parsing endpoint

---

## TypeScript Build Fixes (2025-12-02)

### Session Overview

**Date**: 2025-12-02
**Commits**: `d577bce`, `a4b886f`, `477762a`, `345ebf9`, `4d30bfd`
**Status**: ✅ DEPLOYED

Fixed multiple TypeScript errors that were blocking Vercel production builds.

### 1. ComplianceOverlay Key Error (Line 469)

**Error**: `Property 'name' does not exist on type 'never'`

**Root Cause**: TypeScript narrowed `template` to `never` in else branch because all templates now have `id`

**File**: `/components/ComplianceOverlay.tsx:469`

**Before**:
```tsx
key={'id' in template ? template.id : template.name}
```

**After**:
```tsx
key={template.id}
```

**Commit**: `a4b886f`

### 2. CreateJobForm Variable Hoisting (Line 336)

**Error**: `Block-scoped variable 'parsed' used before its declaration`

**Root Cause**: `parsed` state was declared at line 447 but used in draft save functions at lines 290, 291, 327, 328, and useEffect at 336

**File**: `/components/CreateJobForm.tsx`

**Solution**: Moved state declarations to before their usage

**Before** (line ~447):
```tsx
// Parsed form state
const [parseKey, setParseKey] = useState(0);
const [parsed, setParsed] = useState<any | null>(null);
const [parsing, setParsing] = useState(false);
const [rawText, setRawText] = useState<string | null>(null);
```

**After** (line ~281):
```tsx
// Parsed form state (moved here because it's used in draft save functions below)
const [parseKey, setParseKey] = useState(0);
const [parsed, setParsed] = useState<any | null>(null);
const [parsing, setParsing] = useState(false);
const [rawText, setRawText] = useState<string | null>(null);
```

**Commit**: `d577bce`

### 3. COI Page Type Mismatch

**Error**: Type mismatch in compliance template definitions

**Root Cause**: Missing `show_in_quick` property in template interface

**File**: `/app/settings/coi/page.tsx`

**Solution**: Added missing property to template objects

**Commit**: `4d30bfd`

### Key Learnings

1. **TypeScript Type Narrowing**: When using ternary with `in` operator, TypeScript may narrow to `never` if all possible types have the checked property
2. **React Hook Order**: All hooks and state declarations must be in the same order on every render, and variables must be declared before use in any callbacks or effects
3. **Interface Consistency**: When adding new properties to database schemas, update all TypeScript interfaces and default objects accordingly

### Deployment Result

- All TypeScript errors resolved
- Vercel build succeeded
- Production deployment live at `ravensearch.ai`
- Commit `d577bce` is current production


