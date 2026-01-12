> Archived on 2026-01-12 from FINAL_SETUP_GUIDE.md. Reason: Historical setup guide

# Final Setup Guide - Simple Branch Method

## 🎯 Goal
Launch Claude #1 and Claude #2 to work in parallel on separate branches in the **same project folder**.

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Create Both Branches

Run these commands in your terminal:

```bash
# Navigate to your project
cd ~/ravensearch/raven-claude

# Make sure you're on pixel-haven and it's up to date
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

### Step 2: Verify Branches Were Created

```bash
git branch -a
```

You should see:
```
  feature/operators-landing
  feature/technicians-landing
* pixel-haven
  remotes/origin/feature/operators-landing
  remotes/origin/feature/technicians-landing
  remotes/origin/pixel-haven
```

---

## 🚀 Launch Claude #1 (Technicians Landing Page)

### Before You Start Claude #1

```bash
# Switch to Claude #1's branch
git checkout feature/technicians-landing
```

### Instruction to Give Claude #1

```
Hi! Please read your context file at:
contexts/CLAUDE_1_TECHNICIANS_CONTEXT.md

IMPORTANT - Your Workspace:
- Branch: feature/technicians-landing (you are currently on this branch)
- Work ONLY in: /pages/technicians-landing/
- DO NOT touch: /pages/operators-landing/ (that's for Claude #2)
- DO NOT modify: /frameworks/ (read-only)

When you complete each component, commit your work:
git add pages/technicians-landing/
git commit -m "Add [component name] for technicians landing"
git push origin feature/technicians-landing

Your mission: Build a B2C landing page that converts at 15%+ using the PAS + AIDA frameworks.

Ready to start?
```

---

## 🚀 Launch Claude #2 (Operators Landing Page)

### Before You Start Claude #2

**Important:** Open a **NEW terminal window** or switch branches:

```bash
# Switch to Claude #2's branch
git checkout feature/operators-landing
```

### Instruction to Give Claude #2

```
Hi! Please read your context file at:
contexts/CLAUDE_2_OPERATORS_CONTEXT.md

IMPORTANT - Your Workspace:
- Branch: feature/operators-landing (you are currently on this branch)
- Work ONLY in: /pages/operators-landing/
- DO NOT touch: /pages/technicians-landing/ (that's for Claude #1)
- DO NOT modify: /frameworks/ (read-only)

When you complete each component, commit your work:
git add pages/operators-landing/
git commit -m "Add [component name] for operators landing"
git push origin feature/operators-landing

Your mission: Build a B2B landing page that converts at 10%+ with ROI-focused messaging.

Ready to start?
```

---

## 📊 How This Works

### Branch Isolation

```
pixel-haven (untouched during development)
│
├── feature/technicians-landing (Claude #1)
│   └── Only modifies /pages/technicians-landing/
│
└── feature/operators-landing (Claude #2)
    └── Only modifies /pages/operators-landing/
```

### Why No Conflicts?

- Claude #1 creates/modifies **only** `/pages/technicians-landing/`
- Claude #2 creates/modifies **only** `/pages/operators-landing/`
- Different directories = Zero overlap = Zero conflicts ✅

---

## 👀 Monitoring Progress

### Check Claude #1's Progress

```bash
# Switch to their branch
git checkout feature/technicians-landing

# Pull latest changes
git pull origin feature/technicians-landing

# See what they built
ls -la pages/technicians-landing/components/

# See their commits
git log --oneline
```

### Check Claude #2's Progress

```bash
# Switch to their branch
git checkout feature/operators-landing

# Pull latest changes
git pull origin feature/operators-landing

# See what they built
ls -la pages/operators-landing/components/

# See their commits
git log --oneline
```

---

## ✅ When Both Are Done - Integration

### Step 1: Test Each Branch

**Test Technicians Landing:**
```bash
git checkout feature/technicians-landing
git pull origin feature/technicians-landing
npm run build
# Should build without errors
```

**Test Operators Landing:**
```bash
git checkout feature/operators-landing
git pull origin feature/operators-landing
npm run build
# Should build without errors
```

### Step 2: Merge Both to pixel-haven

```bash
# Switch to pixel-haven
git checkout pixel-haven
git pull origin pixel-haven

# Merge technicians branch
git merge feature/technicians-landing --no-ff -m "Add technicians landing page (B2C, 15%+ target)"

# Merge operators branch
git merge feature/operators-landing --no-ff -m "Add operators landing page (B2B, 10%+ target)"

# Push to remote
git push origin pixel-haven
```

### Step 3: Verify Integration

```bash
# Check that both directories exist
ls -la pages/

# Should show:
# operators-landing/
# technicians-landing/

# Build everything
npm run build

# Run dev server
npm run dev
```

---

## 🧹 Cleanup (Optional - After Successful Merge)

```bash
# Delete local branches
git branch -d feature/technicians-landing
git branch -d feature/operators-landing

# Delete remote branches
git push origin --delete feature/technicians-landing
git push origin --delete feature/operators-landing
```

---

## 🚨 Important Rules During Development

### For You (The Human)

**Don't switch branches while Claudes are working!**

If you need to check Claude #1's work:
```bash
git checkout feature/technicians-landing
git pull
# Review their work
# DON'T start Claude #2 here!
```

If you need to check Claude #2's work:
```bash
git checkout feature/operators-landing
git pull
# Review their work
# DON'T start Claude #1 here!
```

### For Each Claude

They should **never** run these commands:
- ❌ `git checkout` (you control branches)
- ❌ `git merge`
- ❌ `git rebase`
- ❌ Push to `pixel-haven` directly

They **should** run:
- ✅ `git add pages/[their-workspace]/`
- ✅ `git commit -m "message"`
- ✅ `git push origin [their-branch]`
- ✅ `git status` (to see what changed)
- ✅ `git log` (to see commit history)

---

## ⚠️ Troubleshooting

### "I'm confused which branch I'm on"

```bash
# Check current branch
git branch
# The one with * is your current branch
```

### "Claude modified files outside their workspace"

```bash
# See what changed
git status

# If they touched wrong files
git checkout -- [wrong-file]

# Remind Claude of their workspace boundaries
```

### "Merge conflict when integrating"

**This should NOT happen** since they work in different directories. If it does:

```bash
# Check what file has conflict
git status

# If conflict is in /frameworks/ or /app/globals.css
# One Claude violated the read-only rule
# Reject their changes and ask them to fix
```

---

## 📋 Pre-Launch Checklist

Before you tell me to start Claude #1 and #2:

- [ ] In project directory: `~/ravensearch/raven-claude`
- [ ] On `pixel-haven` branch
- [ ] `pixel-haven` is up to date
- [ ] Created `feature/technicians-landing` branch
- [ ] Pushed `feature/technicians-landing` to remote
- [ ] Created `feature/operators-landing` branch
- [ ] Pushed `feature/operators-landing` to remote
- [ ] Verified both branches exist with `git branch -a`
- [ ] Context files exist in `/contexts/`
- [ ] Frameworks exist in `/frameworks/`

---

## 🎯 When to Point Each Claude

### You're Ready to Point Claude #1 When:

1. ✅ You've run the setup commands above
2. ✅ You've switched to `feature/technicians-landing` branch
3. ✅ You're in a terminal/IDE session for Claude #1

**Then give Claude #1 their instruction** (see "Launch Claude #1" section above)

### You're Ready to Point Claude #2 When:

1. ✅ You've run the setup commands above
2. ✅ You've opened a NEW terminal/session
3. ✅ You've switched to `feature/operators-landing` branch
4. ✅ This is a separate session from Claude #1

**Then give Claude #2 their instruction** (see "Launch Claude #2" section above)

---

## 🎉 Success Looks Like

After integration, you'll have:

```
pages/
├── technicians-landing/
│   ├── components/
│   │   ├── HeroSection.tsx
│   │   ├── ValueProposition.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── FAQSection.tsx
│   │   └── FinalCTA.tsx
│   └── landing.tsx
│
└── operators-landing/
    ├── components/
    │   ├── HeroSection.tsx
    │   ├── ValueProposition.tsx
    │   ├── HowItWorks.tsx
    │   ├── FeaturesSection.tsx
    │   ├── ROICalculator.tsx
    │   ├── CaseStudies.tsx
    │   ├── TestimonialsSection.tsx
    │   ├── FAQSection.tsx
    │   └── FinalCTA.tsx
    └── landing.tsx
```

**Zero merge conflicts**
**Two complete landing pages**
**Ready to deploy**

---

**Setup Time:** 5 minutes
**Development Time:** 4-6 hours (parallel)
**Integration Time:** 15 minutes

**Total:** ~5-7 hours for both landing pages! 🚀

