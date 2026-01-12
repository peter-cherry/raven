> Archived on 2026-01-12 from CONFLICT_RESOLUTION.md. Reason: Historical conflict resolution - resolved Nov 2025

# ⚠️ Conflict Resolution: Directory Naming

## Issue Identified

**Date:** November 11, 2025
**Reported by:** Peter Abdo

### Original Problem

The initial directory structure created conflicts with existing application routes:

**Conflict:**
- ❌ `/pages/technicians/` (NEW - marketing landing page)
- ❌ `/app/technicians/page.tsx` (EXISTING - search/filter page)

These would create routing conflicts in Next.js because both serve different purposes but use the same URL path.

### Existing Pages (DO NOT MODIFY)

1. **`/app/technicians/page.tsx`** - Technician search/filter directory
   - Purpose: Browse and search technicians
   - Features: Filters (name, city, state, zip, trade), ratings, availability
   - URL: `/technicians`
   - Status: Production, active

2. **`/app/technicians/signup/page.tsx`** - Technician signup form
   - Purpose: New technician registration
   - URL: `/technicians/signup`

3. **`/app/technicians/landing/page.tsx`** - Existing landing page
   - Purpose: Unknown (needs investigation)
   - URL: `/technicians/landing`

4. **`/app/technicians/[id]/page.tsx`** - Individual technician profile
   - Purpose: View specific technician details
   - URL: `/technicians/{id}`

---

## ✅ Solution Applied

### Renamed Directories

**Before:**
```
pages/
├── technicians/       # ❌ Conflict with /app/technicians/
└── operators/         # ❌ Potential future conflict
```

**After:**
```
pages/
├── technicians-landing/   # ✅ No conflict
└── operators-landing/     # ✅ No conflict
```

### Files Updated

1. **`contexts/CLAUDE_1_TECHNICIANS_CONTEXT.md`**
   - Changed workspace from `/pages/technicians/` to `/pages/technicians-landing/`
   - Updated all component path references
   - Updated workspace boundary rules

2. **`contexts/CLAUDE_2_OPERATORS_CONTEXT.md`**
   - Changed workspace from `/pages/operators/` to `/pages/operators-landing/`
   - Updated all component path references
   - Updated workspace boundary rules

3. **`contexts/ORCHESTRATOR_CONTEXT.md`**
   - Updated integration commands (cp commands)
   - Updated workspace boundary documentation
   - Updated Quick Reference paths

4. **`FRAMEWORK_IMPLEMENTATION_SUMMARY.md`**
   - Updated directory structure diagram
   - Updated workspace descriptions
   - Added clarifying note about separation from app routes

5. **Directory renames:**
   - `pages/technicians/` → `pages/technicians-landing/`
   - `pages/operators/` → `pages/operators-landing/`

---

## 🎯 Final Directory Structure

```
ravensearch/raven-claude/
├── app/                              # Next.js App Router (EXISTING)
│   ├── technicians/
│   │   ├── page.tsx                  # Search/filter page
│   │   ├── signup/page.tsx           # Signup form
│   │   ├── landing/page.tsx          # Existing landing
│   │   └── [id]/page.tsx             # Individual profile
│   └── operators/                    # Future operator app pages
│
├── pages/                            # Marketing Landing Pages (NEW)
│   ├── technicians-landing/          # Claude #1 workspace
│   │   ├── components/
│   │   ├── assets/
│   │   └── styles/
│   └── operators-landing/            # Claude #2 workspace
│       ├── components/
│       ├── assets/
│       └── styles/
│
├── frameworks/                       # Shared Reusable Modules
│   ├── landing-page/
│   ├── seo-geo/
│   └── design-system/
│
└── contexts/                         # Claude Instructions
    ├── CLAUDE_1_TECHNICIANS_CONTEXT.md
    ├── CLAUDE_2_OPERATORS_CONTEXT.md
    └── ORCHESTRATOR_CONTEXT.md
```

---

## 📝 Key Distinctions

### `/app/technicians/` vs `/pages/technicians-landing/`

| Aspect | `/app/technicians/` (EXISTING) | `/pages/technicians-landing/` (NEW) |
|--------|-------------------------------|-------------------------------------|
| **Purpose** | Search/browse technicians | Marketing: convince technicians to join |
| **Audience** | Facility managers | Skilled trade technicians |
| **Type** | Application page | Marketing landing page |
| **Features** | Filters, search, profiles | Hero, value prop, testimonials, CTA |
| **Goal** | Find technicians | Sign up conversions (15%+ target) |
| **URL** | `/technicians` | TBD (will be `/for-technicians` or similar) |
| **Status** | Production | In development |

### Integration Plan

When Claude #1 and #2 complete their work, the marketing landing pages will be moved to:

```
app/
├── for-technicians/          # Marketing landing page
│   └── page.tsx              # From pages/technicians-landing/
└── for-operators/            # Marketing landing page
    └── page.tsx              # From pages/operators-landing/
```

This gives clean URLs:
- Marketing: `https://raven-search.com/for-technicians`
- App: `https://raven-search.com/technicians`

---

## ✅ Verification Checklist

- [x] Directories renamed (technicians → technicians-landing, operators → operators-landing)
- [x] Claude #1 context updated with new workspace path
- [x] Claude #2 context updated with new workspace path
- [x] Orchestrator context updated with integration commands
- [x] Summary document updated with clarifications
- [x] No route conflicts with existing `/app/technicians/` pages
- [x] README files in landing page directories reference correct paths
- [x] All grep searches for old paths completed
- [x] Documentation includes clear distinction between app vs marketing pages

---

## 🚨 Important Notes for Future Development

1. **Always check existing routes** before creating new page directories
2. **Use descriptive names** for marketing pages (e.g., `-landing`, `for-{audience}`)
3. **Document distinctions** between similar-sounding directories
4. **Test URL routing** after integration to ensure no conflicts
5. **Consider URL structure** early in planning phase

---

## 🎯 Next Actions

1. **Launch Claude #1** with updated context (`contexts/CLAUDE_1_TECHNICIANS_CONTEXT.md`)
2. **Launch Claude #2** with updated context (`contexts/CLAUDE_2_OPERATORS_CONTEXT.md`)
3. **When complete**, move landing pages to `/app/for-technicians/` and `/app/for-operators/`
4. **Update routing** in main navigation to link to marketing pages
5. **Test all URLs** to ensure no conflicts

---

**Conflict Resolved:** November 11, 2025
**Status:** ✅ Ready for parallel Claude deployment

