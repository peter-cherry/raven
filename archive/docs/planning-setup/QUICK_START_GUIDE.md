> Archived on 2026-01-12 from QUICK_START_GUIDE.md. Reason: Historical setup guide for parallel Claude development

# Quick Start Guide: Parallel Claude Development

## 🎯 Goal
Build two high-converting landing pages simultaneously using separate Claude instances with **zero merge conflicts**.

---

## ⚡ 5-Minute Setup

### Step 1: Create Git Branches (2 minutes)

```bash
# Make sure you're on pixel-haven
git checkout pixel-haven
git pull origin pixel-haven

# Create Claude #1's branch
git checkout -b feature/technicians-landing
git push -u origin feature/technicians-landing

# Create Claude #2's branch
git checkout pixel-haven
git checkout -b feature/operators-landing
git push -u origin feature/operators-landing

# Return to pixel-haven
git checkout pixel-haven
```

**Verify:**
```bash
git branch -a | grep -E "technicians-landing|operators-landing"
# Should show both local and remote branches
```

---

## 🚀 Launch Claude #1 (Technicians Landing Page)

### Context File
Provide this file to Claude #1:
```
contexts/CLAUDE_1_TECHNICIANS_CONTEXT.md
```

### First Instruction
```
Please read the context file at contexts/CLAUDE_1_TECHNICIANS_CONTEXT.md and confirm you understand your mission and workspace boundaries.

Your workspace: /pages/technicians-landing/ ONLY
Your branch: feature/technicians-landing

DO NOT touch /pages/operators-landing/ or /frameworks/
```

### What Claude #1 Will Build
- HeroSection (B2C, problem-focused)
- ValueProposition (3 key benefits)
- HowItWorks (3 steps)
- FeaturesSection (6-8 features)
- TestimonialsSection (3-5 testimonials)
- FAQSection (5-7 FAQs)
- FinalCTA (conversion-focused)

**Target:** 15%+ conversion rate

---

## 🚀 Launch Claude #2 (Operators Landing Page)

### Context File
Provide this file to Claude #2:
```
contexts/CLAUDE_2_OPERATORS_CONTEXT.md
```

### First Instruction
```
Please read the context file at contexts/CLAUDE_2_OPERATORS_CONTEXT.md and confirm you understand your mission and workspace boundaries.

Your workspace: /pages/operators-landing/ ONLY
Your branch: feature/operators-landing

DO NOT touch /pages/technicians-landing/ or /frameworks/
```

### What Claude #2 Will Build
- HeroSection (B2B, ROI-focused)
- ValueProposition (data-driven benefits)
- HowItWorks (enterprise process)
- FeaturesSection (platform capabilities)
- ROICalculator (interactive cost savings)
- CaseStudies (success stories)
- TestimonialsSection (B2B testimonials)
- FAQSection (enterprise objections)
- FinalCTA (demo scheduling)

**Target:** 10%+ conversion rate

---

## 📊 Monitoring Progress

### Check Claude #1's Work

```bash
git checkout feature/technicians-landing
git pull origin feature/technicians-landing
ls pages/technicians-landing/components/
```

### Check Claude #2's Work

```bash
git checkout feature/operators-landing
git pull origin feature/operators-landing
ls pages/operators-landing/components/
```

---

## ✅ Review Checklist

When each Claude says "I'm done":

### Design System Compliance
- [ ] All styles use CSS variables (no hardcoded values)
- [ ] Glassmorphic effects properly implemented
- [ ] Mobile-responsive (test on actual device)
- [ ] Typography uses font variables
- [ ] Spacing uses spacing tokens

### Component Quality
- [ ] TypeScript interfaces for all components
- [ ] JSDoc comments present
- [ ] No console errors
- [ ] Smooth animations (< 300ms)
- [ ] Accessible (ARIA labels, semantic HTML)

### SEO Implementation
- [ ] SEOHead component used
- [ ] Schema markup added (Organization, FAQPage)
- [ ] Meta descriptions unique and compelling
- [ ] Canonical URLs set

### Conversion Optimization
- [ ] Clear CTAs above the fold
- [ ] Social proof visible
- [ ] Value proposition in first screen
- [ ] FAQ addresses top objections
- [ ] Risk reversal stated

---

## 🔄 Integration (After Both Complete)

### Option A: Quick Merge (Recommended)

```bash
# Test technicians branch
git checkout feature/technicians-landing
npm run build
# Should build without errors

# Test operators branch
git checkout feature/operators-landing
npm run build
# Should build without errors

# Merge both to pixel-haven
git checkout pixel-haven
git merge feature/technicians-landing --no-ff
git merge feature/operators-landing --no-ff
git push origin pixel-haven
```

### Option B: Staged Integration

```bash
# Create integration branch
git checkout pixel-haven
git checkout -b feature/landing-pages-integration
git merge feature/technicians-landing --no-ff
git merge feature/operators-landing --no-ff
git push origin feature/landing-pages-integration

# Create PR for review
# After approval, merge to pixel-haven
```

---

## 🎉 Success Criteria

You'll know it's done when:

**Technical:**
- ✅ Both branches build without errors
- ✅ Zero merge conflicts
- ✅ TypeScript passes (`npm run build`)
- ✅ No console errors in dev mode

**Content:**
- ✅ Technicians page has all 8 components
- ✅ Operators page has all 9 components
- ✅ SEO metadata complete on both
- ✅ Mobile responsive on both

**Performance:**
- ✅ PageSpeed score ≥ 90 on both
- ✅ First Contentful Paint < 1.5s
- ✅ Images optimized

---

## 🚨 Troubleshooting

### Claude Modified Files Outside Their Workspace

**Problem:** Claude #1 touched `/pages/operators-landing/` or vice versa

**Solution:**
```bash
# Check what files were modified
git diff --name-only

# If they violated boundaries, reject changes
git checkout -- <files-outside-workspace>

# Remind Claude of workspace boundaries
```

### Merge Conflicts Occurred

**Problem:** Both Claudes modified the same file (should NOT happen)

**Root Cause:** One Claude violated the read-only rule for `/frameworks/` or both touched `/app/globals.css`

**Solution:**
```bash
# Check conflicting files
git status

# If conflict in /frameworks/ or /app/globals.css
# This is a rule violation - reject and ask Claude to fix

# If legitimate conflict (shouldn't happen with separate directories)
# Manually resolve and commit
```

### Build Errors After Merge

**Problem:** `npm run build` fails after merging both branches

**Solution:**
```bash
# Check TypeScript errors
npm run build 2>&1 | grep error

# Common issues:
# - Missing imports (check component paths)
# - Duplicate component names (rename one)
# - CSS variable not defined (add to globals.css)
```

---

## 📚 Reference Documents

**MUST READ:**
1. `GIT_BRANCHING_STRATEGY.md` - Complete Git workflow
2. `CONFLICT_RESOLUTION.md` - Directory naming and conflicts
3. `FRAMEWORK_IMPLEMENTATION_SUMMARY.md` - Full overview

**Claude Context Files:**
1. `contexts/CLAUDE_1_TECHNICIANS_CONTEXT.md` - For Claude #1
2. `contexts/CLAUDE_2_OPERATORS_CONTEXT.md` - For Claude #2
3. `contexts/ORCHESTRATOR_CONTEXT.md` - For you (integration)

**Framework Documentation:**
1. `frameworks/landing-page/README.md` - Component usage
2. `frameworks/seo-geo/README.md` - SEO implementation

---

## ⏱️ Expected Timeline

| Phase | Duration |
|-------|----------|
| Setup (create branches) | 2 minutes |
| Claude #1 development | 2-3 hours |
| Claude #2 development | 2-3 hours |
| Review each branch | 30 min each |
| Integration & testing | 30 minutes |
| **Total** | **5-7 hours** |

**Parallel Savings:** ~2-3 hours compared to sequential development

---

## 🎯 After Integration

### Move to App Routes

```bash
# Create final landing page routes
mkdir -p app/for-technicians app/for-operators

# Copy integrated work
cp pages/technicians-landing/landing.tsx app/for-technicians/page.tsx
cp pages/operators-landing/landing.tsx app/for-operators/page.tsx

# Update navigation links
# /for-technicians -> Marketing for technicians
# /for-operators -> Marketing for facilities
# /technicians -> App search page (existing)
```

### Update Navigation

Add to main nav/header:
```tsx
<Link href="/for-technicians">For Technicians</Link>
<Link href="/for-operators">For Facilities</Link>
```

### Deploy

```bash
# Commit final changes
git add .
git commit -m "Add marketing landing pages for technicians and operators"
git push origin pixel-haven

# Deploy via Vercel (auto-deploys from pixel-haven)
# Or manually: vercel --prod
```

---

## ✅ Pre-Launch Checklist

Before launching both Claudes:

- [ ] Git branches created (`feature/technicians-landing`, `feature/operators-landing`)
- [ ] Branches pushed to remote
- [ ] Current branch is `pixel-haven`
- [ ] Working directory is clean (`git status`)
- [ ] Context files reviewed
- [ ] Frameworks are in place (`frameworks/landing-page/`, `frameworks/seo-geo/`)
- [ ] Design system variables available (`app/globals.css`)

---

**Ready to launch!** 🚀

Start with Claude #1, then Claude #2, or launch both simultaneously in separate windows.

