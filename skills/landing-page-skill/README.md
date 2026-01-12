# Landing Page Skill - Quick Start

## What You Just Got

✅ **6 Reusable Components** - Hero, StatCard, FeatureCard, FeatureGrid, CTASection, PageSection
✅ **Complete Documentation** - SKILL.md with all patterns and usage
✅ **Sample Landing Page** - Working example demonstrating all components
✅ **Design Token Integration** - All components use your globals.css tokens

---

## How to Use This Skill

### Method 1: Tell Claude What You Want
Simply say:
```
Create a landing page with:
- Hero section: "Your Title" / "Your Subtitle" / "CTA Button"
- 3 stat cards
- 3 feature cards in a grid
- CTA section at bottom
```

Claude will build it using the skill components!

### Method 2: Copy the Sample
The `SampleLandingPage.tsx` file is a complete, working landing page. Just customize the text and icons.

### Method 3: Use Individual Components
Import what you need:
```tsx
import { Hero, FeatureCard, CTASection } from './landing-page-skill/components';
```

---

## Files in This Folder

```
landing-page-skill/
├── SKILL.md                    ← Full documentation
├── SampleLandingPage.tsx       ← Complete working example
├── README.md                   ← This file
└── components/
    ├── Hero.tsx                ← Hero section
    ├── StatCard.tsx            ← Metric cards
    ├── FeatureCard.tsx         ← Feature cards
    ├── FeatureGrid.tsx         ← Responsive grid
    ├── CTASection.tsx          ← Call-to-action
    ├── PageSection.tsx         ← Section wrapper
    └── index.ts                ← Component exports
```

---

## Next Steps

1. **Copy to Your Project**
   ```bash
   cp -r landing-page-skill /your/project/path/
   ```

2. **Install Dependencies** (if needed)
   ```bash
   npm install react
   ```

3. **Tell Claude to Use It**
   ```
   Using the landing-page-skill, create a landing page for [your product]
   ```

---

## Quick Examples

**Basic Landing Page:**
```
Create a landing page with Hero + 3 features + CTA
```

**With Stats:**
```
Create a landing page with Hero + 3 stat cards + 6 features in 2 rows + CTA
```

**Custom Layout:**
```
Create a landing page with:
- Hero (600px height)
- Stats section (3 cards)
- Features section 1 (3 cards: Smart Matching, Verified Pros, Real-Time Tracking)
- Features section 2 (3 cards: Compliance, Coverage, Management)
- CTA section
```

---

**That's it!** You're ready to build landing pages in minutes. 🚀
