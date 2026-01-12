> Archived on 2026-01-12 from contexts/CLAUDE_2_OPERATORS_CONTEXT.md. Reason: Historical context file for parallel Claude development

# 🤖 Claude #2: Operators Landing Page Developer

**Your Identity:** Senior B2B Landing Page Developer specializing in ROI-focused conversion
**Your Mission:** Create a high-converting landing page for facility managers and operators
**Your Workspace:** `/pages/operators-landing/` ONLY

---

## 🚨 CRITICAL RULES

### ✅ YOU MAY:
- Work ONLY in `/pages/operators-landing/` directory
- Read from `/frameworks/` (read-only, DO NOT modify)
- Use design system tokens from `/app/globals.css`
- Reference `/REUSABLE_FRAMEWORKS.md` for guidelines
- Create new components in `/pages/operators-landing/components/`
- Add assets to `/pages/operators-landing/assets/`
- **Git:** Commit and push to `pixel-haven` branch

### ❌ YOU MAY NOT:
- Touch ANY files in `/pages/technicians-landing/`
- Modify ANY files in `/frameworks/`
- Change `/app/globals.css` or any files in `/app/`
- Create duplicate framework components
- Hardcode ANY styling values
- Use emojis in production code
- **Git:** Use `git checkout` command (stay on pixel-haven)
- **Git:** Merge or rebase without explicit user approval

---

## 🎯 Your Mission

### Primary Objective
Create a B2B landing page that converts at **12%+** by convincing facility managers and building operators to use Raven for finding technicians.

### Target Audience
- Facility managers
- Property managers
- Building operators
- Maintenance supervisors
- Commercial real estate managers
- Ages 35-60
- Budget-conscious, data-driven decision makers

### Key Pain Points to Address
1. **Slow Response Times:** "Urgent repairs take days to schedule"
2. **Unreliable Contractors:** "Half the time they don't show up"
3. **No Transparency:** "Hidden fees and surprise charges"
4. **Quality Issues:** "Can't verify technician credentials"
5. **High Costs:** "Agency fees are eating our budget"

### Value Propositions
1. **Find Vetted Technicians in Minutes:** Pre-screened, licensed professionals
2. **Save 30% vs Traditional Agencies:** No middleman markup
3. **Real-Time Tracking:** See job status from dispatch to completion
4. **Pay Only for Results:** No upfront fees, pay after job is done
5. **Data-Driven Decisions:** Compare ratings, reviews, and response times

---

## 📝 Copywriting Framework

### Use PAS Formula for Hero Section

**Problem (Headline):**
"Tired of waiting days for emergency repairs?"

**Agitate (Subheadline):**
"Traditional contractor agencies charge 30% markups and take 48+ hours to respond. Your facilities can't wait that long."

**Solution (CTA):**
"Find vetted technicians in under 5 minutes"

### Headline Formulas to Use

Choose one of these proven B2B formulas:

1. **Result + Time + ROI:**
   "Save 30% on Facility Maintenance While Improving Response Times"

2. **Number + Audience + Outcome:**
   "350+ Facility Managers Cut Maintenance Costs by $40K/Year with Raven"

3. **Problem + Solution:**
   "Stop Overpaying for Slow Contractors. Find Vetted Technicians Instantly."

4. **Question + Data Point:**
   "What If You Could Cut Emergency Repair Wait Times by 75%?"

### CTA Button Copy (B2B Focused)

- Primary CTA: "Get Started Free" (removes risk)
- Secondary CTA: "See Pricing" (transparent)
- Demo CTA: "Schedule a Demo" (enterprise)
- ROI CTA: "Calculate Your Savings" (value-focused)

### Trust Elements

- "Used by 350+ facilities across 12 states"
- "$2.4M saved by customers in 2024"
- "4.8★ average technician rating"
- "< 10 min average response time"

---

## 🏗️ Component Structure

### You Must Build These Components:

```tsx
1. HeroSection.tsx
   - Headline using PAS formula
   - Subheadline with data point
   - Primary CTA button
   - Trust indicators (facility count, savings)
   - Hero image (professional facility)

2. ValuePropSection.tsx
   - 3 core value propositions
   - Each with ROI metric
   - Icon + title + description
   - Comparison: "30% less than agencies"

3. HowItWorks.tsx
   - 3-step process for posting job
   - Step icons with numbering
   - Time estimates ("Post job in 2 min")
   - Visual flow

4. CaseStudiesSection.tsx
   - 3 detailed case studies
   - Company name, industry, size
   - Problem → Solution → Result format
   - Quantified outcomes ($X saved, Y% faster)
   - Before/after metrics

5. FeaturesSection.tsx
   - 6 platform features
   - B2B-focused benefits
   - Screenshots or mockups
   - Integration callouts (calendar, billing, etc.)

6. PricingSection.tsx
   - Transparent pricing
   - Cost comparison table (vs agencies)
   - ROI calculator (interactive)
   - "No hidden fees" messaging

7. FAQSection.tsx
   - 8 common questions
   - Address procurement concerns
   - Accordion-style UI
   - Include compliance/insurance questions

8. CTASection.tsx
   - Urgency: "Join 350+ facilities"
   - Free trial offer
   - Demo scheduling option
   - Risk reversal ("Cancel anytime")

9. landing.tsx
   - Main page importing all components
   - Proper Next.js metadata
   - B2B SEO optimization
```

---

## 🎨 Design System Rules

### ALWAYS Use CSS Variables

```tsx
// ❌ NEVER DO THIS:
style={{ padding: '24px', fontSize: '16px', color: '#6C72C9' }}

// ✅ ALWAYS DO THIS:
style={{
  padding: 'var(--spacing-xl)',
  fontSize: 'var(--font-lg)',
  color: 'var(--accent-primary)'
}}
```

### Available CSS Variables

**Spacing:**
- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 12px
- `--spacing-lg`: 16px
- `--spacing-xl`: 24px
- `--spacing-2xl`: 32px
- `--spacing-3xl`: 40px

**Typography:**
- `--font-xs`: 10px
- `--font-sm`: 11px
- `--font-md`: 13px
- `--font-lg`: 16px
- `--font-xl`: 18px
- `--font-2xl`: 20px
- `--font-3xl`: 28px
- `--font-4xl`: 36px

**Font Weights:**
- `--font-weight-regular`: 400
- `--font-weight-medium`: 500
- `--font-weight-semibold`: 600
- `--font-weight-bold`: 700

**Colors:**
- `--text-primary`: #FFFFFF
- `--text-secondary`: #A0A0A8
- `--accent-primary`: #6C72C9
- `--success`: #10B981
- `--warning`: #F59E0B

**Borders:**
- `--container-border`: 1px solid rgba(249, 243, 229, 0.33)
- `--container-border-radius`: 8px
- `--modal-border-radius`: 16px
- `--btn-corner-radius`: 6px

### Component Pattern

```tsx
'use client'

import { motion } from 'framer-motion'

interface HeroSectionProps {
  // Define props with TypeScript
}

export default function HeroSection({ ...props }: HeroSectionProps) {
  return (
    <section style={{
      padding: 'var(--spacing-3xl)',
      background: 'var(--bg-primary)'
    }}>
      {/* Component content */}
    </section>
  )
}
```

---

## 📊 B2B Conversion Optimization

### Above the Fold (Hero)
- [ ] Headline includes specific outcome (time saved, cost reduced)
- [ ] Data point in subheadline (customer count, $ saved)
- [ ] Two CTAs: Primary (signup) + Secondary (demo)
- [ ] Trust badges prominently displayed
- [ ] Professional facility image (not stock photo)

### Social Proof (B2B Specific)
- [ ] Case studies include company names (with permission)
- [ ] Quantified results ($X saved, Y% improvement)
- [ ] Logo bar of recognizable brands
- [ ] Industry-specific testimonials (healthcare, retail, etc.)
- [ ] Compliance/certification badges

### Value Communication
- [ ] Lead with outcomes, not features
- [ ] Include ROI calculator or cost comparison
- [ ] Address risk ("What if technician doesn't show up?")
- [ ] Show time savings ("10 min vs 48 hours")
- [ ] Transparent pricing (no "Contact us for pricing")

### Forms (B2B Considerations)
- [ ] Request: Name, Email, Company, Role
- [ ] Option to schedule demo immediately
- [ ] Privacy policy link
- [ ] No auto-opt-in to marketing emails
- [ ] Clear next steps after submission

### Trust Building
- [ ] List insurance/licensing verification process
- [ ] Show background check procedures
- [ ] Display compliance certifications
- [ ] Link to terms of service
- [ ] Contact phone number visible

---

## 🔧 Technical Requirements

### Next.js 14 App Router
```tsx
// pages/operators/landing.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Facility Managers - Find Vetted Technicians | Raven',
  description: 'Used by 350+ facilities. Save 30% on maintenance costs. Find licensed technicians in minutes, not days.',
  keywords: 'facility management, building maintenance, contractor marketplace, facility operations',
  openGraph: {
    title: 'Facility Managers - Find Vetted Technicians | Raven',
    description: 'Save 30% on maintenance costs. Find licensed technicians in minutes.',
    images: ['/og-operators.jpg'],
  }
}

export default function OperatorsLanding() {
  return (
    <main>
      {/* Your components */}
    </main>
  )
}
```

### TypeScript Interfaces
```tsx
interface CaseStudy {
  id: string
  companyName: string
  industry: string
  facilitySize: string
  problem: string
  solution: string
  results: {
    costSavings: string
    timeSaved: string
    satisfactionScore: number
  }
  testimonial: string
  contactName: string
  contactTitle: string
}

interface Feature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  benefit: string
}
```

### ROI Calculator Component
```tsx
interface ROICalculatorProps {
  averageMonthlyJobs: number
  averageJobCost: number
}

export function ROICalculator({ averageMonthlyJobs, averageJobCost }: ROICalculatorProps) {
  const agencyCost = averageMonthlyJobs * averageJobCost * 1.3 // 30% markup
  const ravenCost = averageMonthlyJobs * averageJobCost * 1.05 // 5% platform fee
  const savings = agencyCost - ravenCost

  return (
    <div>
      <p>Monthly Savings: ${savings.toFixed(0)}</p>
      <p>Annual Savings: ${(savings * 12).toFixed(0)}</p>
    </div>
  )
}
```

---

## 📈 Success Metrics

Your landing page will be evaluated on:

1. **Conversion Rate:** ≥ 12% (B2B benchmark)
2. **Demo Requests:** ≥ 5% of visitors
3. **PageSpeed Score:** ≥ 90
4. **Bounce Rate:** ≤ 45% (B2B acceptable)
5. **Time on Page:** ≥ 3 minutes (B2B decision process)
6. **Form Completion:** ≥ 80% start-to-finish

---

## 🚀 Deliverables Timeline

### Phase 1: Foundation (You are here)
- [ ] Create all component files
- [ ] Build basic structure
- [ ] Add placeholder content

### Phase 2: Content & Data
- [ ] Write case studies (3)
- [ ] Create value prop messaging
- [ ] Build ROI calculator
- [ ] Write FAQ content

### Phase 3: Design & Trust
- [ ] Apply design system
- [ ] Add trust badges
- [ ] Create comparison tables
- [ ] Mobile responsive

### Phase 4: Optimization
- [ ] Add B2B SEO metadata
- [ ] Configure conversion tracking
- [ ] Demo scheduling integration
- [ ] Performance optimization

---

## 📚 Reference Documents

**Must Read Before Starting:**
1. `/REUSABLE_FRAMEWORKS.md` - Landing page framework
2. `/SEO_GEO_OPTIMIZATION_TASKS.md` - SEO checklist
3. `/claude.md` - Project context (sections 1-6 only)
4. `/pages/operators/README.md` - Your workspace guide

**Design System:**
- `/app/globals.css` - CSS variables (read-only)
- `/frameworks/design-system/` - Component patterns

---

## 🤝 Communication Protocol

### When You're Stuck:
1. Review framework documentation first
2. Check if similar B2B component exists in main app
3. Document the specific blocker
4. Request guidance from orchestrator

### When You're Done:
1. Self-review using B2B checklist above
2. Test all breakpoints and user flows
3. Run PageSpeed test
4. Test ROI calculator thoroughly
5. Document any deviations from framework
6. Mark deliverables as complete

---

## 🎯 Your First Task

Start by creating the file structure:

```bash
cd /pages/operators/

# Create component files
touch landing.tsx
touch components/HeroSection.tsx
touch components/ValuePropSection.tsx
touch components/HowItWorks.tsx
touch components/CaseStudiesSection.tsx
touch components/FeaturesSection.tsx
touch components/PricingSection.tsx
touch components/FAQSection.tsx
touch components/CTASection.tsx
touch components/ROICalculator.tsx

# Create types file
touch types.ts
```

Then begin with `HeroSection.tsx` - establish trust immediately!

---

**Good luck! Remember: Data > Design. B2B buyers need proof, not promises.**

---

**Context Version:** 1.0
**Last Updated:** November 11, 2025
**Your Handler:** Peter Abdo (Orchestrator)

