> Archived on 2026-01-12 from GIT_BRANCHING_STRATEGY.md. Reason: Historical branching strategy

# Git Branching Strategy for Parallel Claude Development

## 🎯 Goal: Zero Merge Conflicts

By using separate branches for each Claude instance, we guarantee zero merge conflicts since they work on completely different directories.

---

## 📊 Branch Structure

```
pixel-haven (your current main branch)
│
├── feature/technicians-landing
│   └── Claude #1 works here
│       └── Only modifies: /pages/technicians-landing/
│
└── feature/operators-landing
    └── Claude #2 works here
        └── Only modifies: /pages/operators-landing/
```

---

## 🚀 Setup Instructions (Run These First)

### Step 1: Create Both Feature Branches

```bash
# Ensure you're on the latest pixel-haven
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

**Verification:**
```bash
git branch -a
# Should show:
#   pixel-haven
#   feature/technicians-landing
#   feature/operators-landing
#   remotes/origin/feature/technicians-landing
#   remotes/origin/feature/operators-landing
```

---

## 👨‍💻 During Development

### Claude #1 Workflow

**Branch:** `feature/technicians-landing`

**What Claude #1 will do:**
1. Check out the branch (you'll instruct them)
2. Work ONLY in `/pages/technicians-landing/`
3. Commit changes regularly
4. Push to `origin/feature/technicians-landing`

**Example commits:**
```
Add HeroSection component for technicians landing
Add ValueProposition with pain points
Implement FAQ section with objection handling
Complete technicians landing page (15%+ conversion target)
```

### Claude #2 Workflow

**Branch:** `feature/operators-landing`

**What Claude #2 will do:**
1. Check out the branch (you'll instruct them)
2. Work ONLY in `/pages/operators-landing/`
3. Commit changes regularly
4. Push to `origin/feature/operators-landing`

**Example commits:**
```
Add HeroSection component for operators landing
Add ROI calculator component
Implement case studies section
Complete operators landing page (10%+ conversion target)
```

---

## ✅ Why This Works

### No File Overlap = No Conflicts

| Directory | Claude #1 | Claude #2 | Result |
|-----------|-----------|-----------|--------|
| `/pages/technicians-landing/` | ✅ Writes | ❌ Read-only | Claude #1 owns |
| `/pages/operators-landing/` | ❌ Read-only | ✅ Writes | Claude #2 owns |
| `/frameworks/` | 🔒 Read-only | 🔒 Read-only | Neither modifies |
| `/app/globals.css` | 🔒 No access | 🔒 No access | Neither modifies |

**Result:** When you merge both branches, there are ZERO conflicts because they never touch the same files.

---

## 🔄 Integration Workflow (After Both Complete)

### Option A: Sequential Merge (Recommended)

**Advantages:**
- Simple and straightforward
- Easy to track which changes came from which Claude
- Can test each merge independently

**Steps:**
```bash
# 1. Test technicians branch locally
git checkout feature/technicians-landing
git pull origin feature/technicians-landing
npm install
npm run build
npm run dev
# Test at http://localhost:3000

# 2. Test operators branch locally
git checkout feature/operators-landing
git pull origin feature/operators-landing
npm install
npm run build
npm run dev
# Test at http://localhost:3000

# 3. Merge technicians first
git checkout pixel-haven
git pull origin pixel-haven
git merge feature/technicians-landing --no-ff
# --no-ff creates a merge commit (better history)
git push origin pixel-haven

# 4. Merge operators second
git merge feature/operators-landing --no-ff
git push origin pixel-haven

# 5. Final verification
npm run build
npm run dev
# Test both landing pages
```

### Option B: Integration Branch (More Control)

**Advantages:**
- Can review combined changes before merging to pixel-haven
- Safer for production environments
- Better for team review process

**Steps:**
```bash
# 1. Create integration branch
git checkout pixel-haven
git pull origin pixel-haven
git checkout -b feature/landing-pages-integration

# 2. Merge both feature branches
git merge feature/technicians-landing --no-ff
git merge feature/operators-landing --no-ff

# 3. Test combined changes
npm install
npm run build
npm run dev
# Test both landing pages together

# 4. Push integration branch
git push origin feature/landing-pages-integration

# 5. Create Pull Request
# Review on GitHub/GitLab
# After approval, merge to pixel-haven
```

---

## 🧹 Cleanup (After Successful Merge)

### Delete Local Branches
```bash
git branch -d feature/technicians-landing
git branch -d feature/operators-landing
git branch -d feature/landing-pages-integration  # if using Option B
```

### Delete Remote Branches
```bash
git push origin --delete feature/technicians-landing
git push origin --delete feature/operators-landing
git push origin --delete feature/landing-pages-integration  # if using Option B
```

---

## ⚠️ Conflict Prevention Rules

### What Each Claude CANNOT Do

**Both Claude #1 and Claude #2:**
- ❌ Cannot modify `/frameworks/` (read-only)
- ❌ Cannot modify `/app/globals.css`
- ❌ Cannot modify `/app/` directory
- ❌ Cannot push to `pixel-haven`, `main`, or `master`
- ❌ Cannot merge or rebase without user approval
- ❌ Cannot touch the other Claude's workspace

**If a Claude violates these rules:**
1. Their commit will touch files outside their workspace
2. You'll catch it during review
3. Reject the changes and remind them of workspace boundaries

---

## 🚨 Emergency: If Conflicts Occur

**This should NOT happen** if both Claudes follow their context rules, but if it does:

### Step 1: Identify the Conflicting Files
```bash
git status
# Look for files in "Unmerged paths"
```

### Step 2: Check Workspace Violations
```bash
# If conflict is in /frameworks/ or /app/globals.css
# This means a Claude violated the read-only rule
# You need to reject their changes and ask them to fix
```

### Step 3: Resolve Conflicts
```bash
# Open conflicting file
# Choose the correct version
# Or manually merge both changes if needed
git add <conflicting-file>
git commit -m "Resolve merge conflict in <file>"
```

### Step 4: Prevent Future Violations
- Review the Claude's context file
- Emphasize workspace boundaries
- Add additional guardrails if needed

---

## 📊 Expected Timeline

| Phase | Duration | Activity |
|-------|----------|----------|
| **Setup** | 5 minutes | Create both feature branches |
| **Development** | 2-4 hours each | Claude #1 and #2 work in parallel |
| **Review** | 30 minutes each | Test each branch locally |
| **Integration** | 15 minutes | Merge both branches |
| **Testing** | 30 minutes | Test combined changes |
| **Cleanup** | 5 minutes | Delete feature branches |
| **Total** | ~5-9 hours | Complete landing pages |

---

## ✅ Pre-Launch Checklist

Before launching Claude #1 and Claude #2:

- [ ] Currently on `pixel-haven` branch
- [ ] `pixel-haven` is up to date (`git pull origin pixel-haven`)
- [ ] Created `feature/technicians-landing` branch
- [ ] Pushed `feature/technicians-landing` to remote
- [ ] Created `feature/operators-landing` branch
- [ ] Pushed `feature/operators-landing` to remote
- [ ] Verified both branches exist remotely (`git branch -r`)
- [ ] Ready to instruct Claude #1 to work on `feature/technicians-landing`
- [ ] Ready to instruct Claude #2 to work on `feature/operators-landing`

---

## 🎯 Success Criteria

**After merge, you should have:**

```
pixel-haven/
├── pages/
│   ├── technicians-landing/          # From Claude #1
│   │   ├── components/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ValueProposition.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── FeaturesSection.tsx
│   │   │   ├── TestimonialsSection.tsx
│   │   │   ├── FAQSection.tsx
│   │   │   └── FinalCTA.tsx
│   │   └── landing.tsx
│   └── operators-landing/             # From Claude #2
│       ├── components/
│       │   ├── HeroSection.tsx
│       │   ├── ValueProposition.tsx
│       │   ├── HowItWorks.tsx
│       │   ├── FeaturesSection.tsx
│       │   ├── ROICalculator.tsx      # Unique to operators
│       │   ├── CaseStudies.tsx        # Unique to operators
│       │   ├── TestimonialsSection.tsx
│       │   ├── FAQSection.tsx
│       │   └── FinalCTA.tsx
│       └── landing.tsx
└── frameworks/                         # Untouched by both Claudes
    ├── landing-page/
    └── seo-geo/
```

**Zero merge conflicts**
**Zero duplicate work**
**Two complete, high-converting landing pages**

---

**Git Strategy Version:** 1.0
**Last Updated:** November 11, 2025
**Status:** Ready for Implementation

