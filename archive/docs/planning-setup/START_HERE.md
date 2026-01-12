> Archived on 2026-01-12 from START_HERE.md. Reason: Historical setup instructions

# 🚀 START HERE - Launch Claude #1 and Claude #2

## Step 1: Run Setup Commands (2 Minutes)

Open terminal and run:

```bash
cd ~/ravensearch/raven-claude
git checkout pixel-haven
git pull origin pixel-haven
git checkout -b feature/technicians-landing
git push -u origin feature/technicians-landing
git checkout pixel-haven
git checkout -b feature/operators-landing
git push -u origin feature/operators-landing
git checkout pixel-haven
```

**Done?** ✅ Both branches created and pushed to GitHub

---

## Step 2: Launch Claude #1 (Technicians)

### A. Switch to Claude #1's Branch

```bash
git checkout feature/technicians-landing
```

### B. Give Claude #1 This Exact Message

```
Please read your context file at:
contexts/CLAUDE_1_TECHNICIANS_CONTEXT.md

IMPORTANT:
- You are on branch: feature/technicians-landing
- Your workspace: /pages/technicians-landing/ ONLY
- DO NOT touch: /pages/operators-landing/
- DO NOT modify: /frameworks/ (read-only)

When you complete components, commit:
git add pages/technicians-landing/
git commit -m "Add [component name]"
git push origin feature/technicians-landing

Target: 15%+ conversion rate, B2C landing page for technicians.
Ready?
```

---

## Step 3: Launch Claude #2 (Operators)

### A. Open NEW Terminal Window

### B. Switch to Claude #2's Branch

```bash
cd ~/ravensearch/raven-claude
git checkout feature/operators-landing
```

### C. Give Claude #2 This Exact Message

```
Please read your context file at:
contexts/CLAUDE_2_OPERATORS_CONTEXT.md

IMPORTANT:
- You are on branch: feature/operators-landing
- Your workspace: /pages/operators-landing/ ONLY
- DO NOT touch: /pages/technicians-landing/
- DO NOT modify: /frameworks/ (read-only)

When you complete components, commit:
git add pages/operators-landing/
git commit -m "Add [component name]"
git push origin feature/operators-landing

Target: 10%+ conversion rate, B2B landing page for facility managers.
Ready?
```

---

## Step 4: Monitor Their Progress

### Check Claude #1:
```bash
git checkout feature/technicians-landing
git pull
ls pages/technicians-landing/components/
```

### Check Claude #2:
```bash
git checkout feature/operators-landing
git pull
ls pages/operators-landing/components/
```

---

## Step 5: Integration (When Both Say "Done")

```bash
git checkout pixel-haven
git pull origin pixel-haven
git merge feature/technicians-landing --no-ff
git merge feature/operators-landing --no-ff
git push origin pixel-haven
```

**That's it!** Both landing pages are now in pixel-haven.

---

## ✅ Checklist

- [ ] Ran setup commands
- [ ] Verified branches exist (`git branch -a`)
- [ ] Started Claude #1 on `feature/technicians-landing`
- [ ] Started Claude #2 on `feature/operators-landing`
- [ ] Both Claudes confirmed they read their context files
- [ ] Monitoring their progress regularly
- [ ] When done: Merged both branches to pixel-haven

---

## 🚨 If Something Goes Wrong

**Claude modified wrong files:**
```bash
git status  # See what changed
git checkout -- [wrong-file]  # Undo wrong changes
```

**Confused which branch you're on:**
```bash
git branch  # * shows current branch
```

**Need detailed help:**
- See `FINAL_SETUP_GUIDE.md` for complete instructions
- See `CONFLICT_RESOLUTION.md` for directory conflicts
- See context files in `/contexts/` for Claude instructions

---

## 📊 What Each Claude Will Build

### Claude #1 (Technicians) - 8 Components
1. HeroSection
2. SocialProofBanner
3. ValueProposition
4. HowItWorks
5. FeaturesSection
6. TestimonialsSection
7. FAQSection
8. FinalCTA

### Claude #2 (Operators) - 9 Components
1. HeroSection
2. SocialProofBanner
3. ValueProposition
4. HowItWorks
5. FeaturesSection
6. ROICalculator ⭐ (unique to operators)
7. CaseStudies ⭐ (unique to operators)
8. TestimonialsSection
9. FAQSection
10. FinalCTA

---

## ⏱️ Timeline

- Setup: 2 minutes
- Claude #1 development: 2-3 hours
- Claude #2 development: 2-3 hours (parallel!)
- Integration: 15 minutes

**Total: ~5-7 hours for both pages** 🎉

---

**Ready? Run Step 1 setup commands, then let me know when you're ready to point the Claudes!**

