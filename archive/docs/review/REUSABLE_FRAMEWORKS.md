> Archived on 2026-01-12 from REUSABLE_FRAMEWORKS.md. Reason: Review needed - may contain active framework docs

# 🎯 Reusable Frameworks System
**Purpose:** Create plug-and-play frameworks for all future projects
**Owner:** Peter Abdo + Claude Code
**Status:** Active Development
**Version:** 1.0 – November 2025

---

## Philosophy

Every component, module, and framework we build must be:
1. **100% Reusable** - Works across multiple projects with minimal modification
2. **Framework-Driven** - Clear process to follow, not just code snippets
3. **Documented** - Step-by-step implementation guide
4. **Modular** - Can be integrated independently without dependencies
5. **Battle-Tested** - Proven to work in production

---

## 🏗️ Framework Categories

### 1. Landing Page Frameworks
### 2. SEO-GEO Module
### 3. Design System Template
### 4. Authentication Module
### 5. Analytics & Tracking Module
### 6. Form System Framework
### 7. Email Integration Framework
### 8. Payment Processing Module

---

## 📦 Framework #1: High-Converting Landing Page

**Goal:** Create landing pages that convert at 15%+ using proven copywriting methods

### Copywriting Framework: PAS + AIDA Hybrid

**P.A.S. Formula (Pain-Agitate-Solution):**
1. **Problem** - Identify the specific pain point (Hero section)
2. **Agitate** - Amplify the emotional impact (Features section)
3. **Solution** - Present your product as the answer (CTA section)

**A.I.D.A. Formula (Attention-Interest-Desire-Action):**
1. **Attention** - Grab with bold headline + compelling visual
2. **Interest** - Build with benefits, not features
3. **Desire** - Create urgency with social proof + testimonials
4. **Action** - Clear, friction-free CTA

### Landing Page Structure (Universal Template)

```
└── Landing Page
    ├── Hero Section (Above the Fold)
    │   ├── Headline (PAS: Problem) - 10 words max
    │   ├── Sub-headline (PAS: Agitate) - 20 words max
    │   ├── Primary CTA Button (AIDA: Action)
    │   ├── Trust Indicator (logos, badges)
    │   └── Hero Visual (screenshot/video)
    │
    ├── Social Proof Section
    │   ├── Stats Bar (numbers that matter)
    │   ├── Testimonials (3-5, with photos)
    │   └── Client Logos
    │
    ├── Value Proposition (AIDA: Interest)
    │   ├── 3 Core Benefits (not features)
    │   ├── Benefit Icons
    │   └── Brief Descriptions
    │
    ├── How It Works (3 Steps Max)
    │   ├── Step 1: Easy entry point
    │   ├── Step 2: Magic moment
    │   └── Step 3: Desired outcome
    │
    ├── Features Section (AIDA: Desire)
    │   ├── Feature Cards (benefit-first)
    │   ├── Visual Demonstrations
    │   └── Use Case Scenarios
    │
    ├── Social Proof Deep Dive
    │   ├── Case Studies (2-3)
    │   ├── Video Testimonials
    │   └── Before/After Results
    │
    ├── Objection Handling (FAQ)
    │   ├── 5-7 Common Questions
    │   ├── Risk Reversal (guarantee)
    │   └── Comparison Table
    │
    ├── Final CTA Section
    │   ├── Urgency Element (scarcity/time)
    │   ├── Repeat Primary CTA
    │   └── Secondary CTA (alternative path)
    │
    └── Footer
        ├── Trust Signals (security badges)
        ├── Contact Info
        └── Legal Links
```

### Copywriting Techniques (Battle-Tested)

**1. Headline Formulas:**
- "Get [Desired Result] in [Time Frame] Without [Pain Point]"
- "[Number] [Audience] Use [Product] to [Achieve Result]"
- "How to [Achieve Goal] Even If [Objection]"

**2. CTA Button Copy (Never use "Submit"):**
- "Get Started Free" (removes risk)
- "See How It Works" (curiosity)
- "Join 10,000+ [Audience]" (social proof)
- "Claim Your Spot" (urgency)

**3. Urgency Triggers:**
- Time-based: "Offer ends in 48 hours"
- Quantity-based: "Only 12 spots left"
- FOMO: "Join 500+ who signed up this week"

**4. Trust Building:**
- Display real numbers (not rounded)
- Show recent activity ("Sarah from NYC just signed up")
- Add micro-copy near CTAs ("No credit card required")

### Component Checklist

- [ ] Hero headline passes 5-second test (visitor knows what it is immediately)
- [ ] CTA buttons use action-oriented copy
- [ ] Testimonials include name, photo, and specific result
- [ ] Benefits are outcome-focused, not feature-focused
- [ ] Page loads in < 2 seconds
- [ ] Mobile-first responsive design
- [ ] A/B test variants prepared (headline, CTA, hero image)

### Conversion Optimization Checklist

- [ ] Single clear goal per page (don't distract)
- [ ] CTA visible without scrolling (above the fold)
- [ ] Forms request minimum information (name + email only)
- [ ] Exit-intent popup with compelling offer
- [ ] Chat widget positioned for easy access
- [ ] Heatmap tracking enabled (Hotjar/Microsoft Clarity)

---

## 📦 Framework #2: SEO-GEO Module

**Goal:** Plug-and-play module that makes any project 100% SEO + GEO optimized

### Module Structure

```
└── seo-geo-module/
    ├── config/
    │   ├── seo.config.ts         # Site-wide SEO settings
    │   ├── geo.config.ts         # Regional targeting settings
    │   └── schema.config.ts      # Structured data templates
    │
    ├── components/
    │   ├── SEOHead.tsx           # Meta tags component
    │   ├── SchemaMarkup.tsx      # JSON-LD component
    │   ├── BreadcrumbsSchema.tsx # Breadcrumb structured data
    │   └── LocalBusinessSchema.tsx # Local business markup
    │
    ├── utils/
    │   ├── generateSitemap.ts    # Dynamic sitemap generator
    │   ├── generateRobots.ts     # Dynamic robots.txt
    │   └── seoHelpers.ts         # Meta tag utilities
    │
    ├── middleware/
    │   └── redirects.ts          # 301/302 redirect handler
    │
    └── public/
        ├── robots.txt            # Generated on build
        └── sitemap.xml           # Generated on build
```

### Implementation Steps

**Step 1: Install Module**
```bash
# Copy module folder into project
cp -r seo-geo-module /project/modules/

# Install dependencies
npm install next-sitemap schema-dts
```

**Step 2: Configure Settings**
```typescript
// seo.config.ts
export const seoConfig = {
  siteName: "Your Site Name",
  defaultTitle: "Homepage Title",
  defaultDescription: "Default meta description",
  defaultOgImage: "/og-image.jpg",
  twitterHandle: "@yourhandle",
  canonicalBase: "https://yourdomain.com"
}
```

**Step 3: Add to Layout**
```tsx
import { SEOHead } from '@/modules/seo-geo-module/components/SEOHead'

export default function RootLayout({ children }) {
  return (
    <html lang="en-US">
      <SEOHead
        title="Page Title"
        description="Page description"
        keywords="keyword1, keyword2"
      />
      <body>{children}</body>
    </html>
  )
}
```

**Step 4: Add Schema Markup**
```tsx
import { SchemaMarkup } from '@/modules/seo-geo-module/components/SchemaMarkup'

export default function HomePage() {
  return (
    <>
      <SchemaMarkup
        type="Organization"
        data={{
          name: "Company Name",
          url: "https://yourdomain.com",
          logo: "/logo.png"
        }}
      />
      {/* Page content */}
    </>
  )
}
```

### GEO Optimization Features

**Regional Pages Generator:**
```typescript
// Auto-generate pages for each region
const regions = ['florida', 'new-york', 'california', 'texas']
const trades = ['hvac', 'plumbing', 'electrical', 'carpentry']

// Creates: /florida-hvac-technicians, /new-york-plumbing, etc.
regions.forEach(region => {
  trades.forEach(trade => {
    generateRegionalPage(region, trade)
  })
})
```

**NAP Consistency Component:**
```tsx
<ContactInfo
  name="Company Name"
  address="123 Main St, Miami, FL 33101"
  phone="+1-305-123-4567"
  consistent={true} // Ensures same format everywhere
/>
```

### Analytics Integration

```typescript
// Track regional performance
trackEvent('regional_page_view', {
  region: 'florida',
  trade: 'hvac',
  source: 'organic'
})
```

---

## 📦 Framework #3: Design System Template

**Goal:** Reusable design system that ensures visual consistency

### Structure

```
└── design-system/
    ├── tokens/
    │   ├── colors.css           # Color palette
    │   ├── typography.css       # Font definitions
    │   ├── spacing.css          # Spacing scale
    │   └── shadows.css          # Shadow tokens
    │
    ├── components/
    │   ├── Button.tsx           # All button variants
    │   ├── Input.tsx            # Form inputs
    │   ├── Card.tsx             # Container cards
    │   └── Modal.tsx            # Modal overlays
    │
    └── documentation/
        └── storybook.config.js  # Component gallery
```

### Implementation Pattern

**Always use CSS variables:**
```css
/* NEVER hardcode */
❌ padding: 24px
❌ color: #6C72C9

/* ALWAYS use tokens */
✅ padding: var(--spacing-xl)
✅ color: var(--accent-primary)
```

---

## 🔄 Parallel Claude Workflow System

**Goal:** Multiple Claude instances working simultaneously without overlap

### Workflow Architecture

```
Main Orchestrator (You - Current Claude)
├── Claude #1: Technicians Landing Page
│   ├── Context File: technicians-context.md
│   ├── Working Directory: /pages/technicians/
│   └── Deliverable: High-converting landing page
│
├── Claude #2: Operators Landing Page
│   ├── Context File: operators-context.md
│   ├── Working Directory: /pages/operators/
│   └── Deliverable: High-converting landing page
│
└── Integration Claude (You)
    ├── Reviews both outputs
    ├── Ensures consistency
    └── Merges into main project
```

### File Organization (Zero Overlap)

```
ravensearch/raven-claude/
├── pages/
│   ├── technicians/              # Claude #1 workspace
│   │   ├── landing.tsx
│   │   ├── components/
│   │   └── assets/
│   │
│   └── operators/                # Claude #2 workspace
│       ├── landing.tsx
│       ├── components/
│       └── assets/
│
├── frameworks/                   # Shared frameworks (read-only)
│   ├── landing-page/
│   ├── seo-geo/
│   └── design-system/
│
└── contexts/                     # Claude-specific instructions
    ├── technicians-context.md    # For Claude #1
    ├── operators-context.md      # For Claude #2
    └── integration-context.md    # For orchestrator
```

### Context Files (Prevent Overlap)

**technicians-context.md:**
```markdown
# Technicians Landing Page Context

## Your Scope
- ONLY work on `/pages/technicians/` directory
- DO NOT modify any operators files
- Use frameworks from `/frameworks/` (read-only)

## Goal
Create high-converting landing page for technicians to sign up

## Deliverables
1. landing.tsx (main page)
2. HeroSection.tsx
3. BenefitsSection.tsx
4. TestimonialsSection.tsx
5. CTASection.tsx

## Frameworks to Use
- Landing Page Framework (REUSABLE_FRAMEWORKS.md)
- SEO-GEO Module
- Design System tokens
```

**operators-context.md:**
```markdown
# Operators Landing Page Context

## Your Scope
- ONLY work on `/pages/operators/` directory
- DO NOT modify any technicians files
- Use frameworks from `/frameworks/` (read-only)

## Goal
Create high-converting landing page for facility managers/operators to post jobs

## Deliverables
1. landing.tsx (main page)
2. HeroSection.tsx
3. FeaturesSection.tsx
4. CaseStudiesSection.tsx
5. CTASection.tsx

## Frameworks to Use
- Landing Page Framework (REUSABLE_FRAMEWORKS.md)
- SEO-GEO Module
- Design System tokens
```

### Handoff Protocol

**Phase 1: Parallel Development (Claude #1 and #2)**
- Both Claudes work independently
- No communication between them
- Both reference shared frameworks

**Phase 2: Integration Review (Orchestrator)**
- You review both deliverables
- Check for consistency
- Ensure design system compliance
- Verify no duplicate code

**Phase 3: Merge & Deploy**
- Combine into main project
- Run integration tests
- Deploy to staging

---

## 📊 Success Metrics

### Framework Effectiveness
- [ ] Can new project integrate module in < 1 hour
- [ ] Zero modifications needed to core framework code
- [ ] Works across 3+ different projects

### Landing Page Performance
- [ ] Conversion rate ≥ 15%
- [ ] PageSpeed score ≥ 90
- [ ] Bounce rate ≤ 40%
- [ ] Time on page ≥ 2 minutes

### SEO-GEO Module
- [ ] All pages pass Google Rich Results Test
- [ ] Sitemap auto-updates on deploy
- [ ] Regional pages rank within 30 days
- [ ] Core Web Vitals pass

---

## 🎯 Next Steps

1. **Create Frameworks Folder**
   ```bash
   mkdir -p ravensearch/raven-claude/frameworks/{landing-page,seo-geo,design-system}
   ```

2. **Build Component Libraries**
   - Extract existing components into framework
   - Document usage patterns
   - Create Storybook demos

3. **Set Up Claude Workspaces**
   - Create context files for each Claude
   - Define clear boundaries
   - Establish handoff checkpoints

4. **Launch Parallel Development**
   - Assign Technicians page to Claude #1
   - Assign Operators page to Claude #2
   - Monitor for conflicts

---

**Last Updated:** November 11, 2025
**Version:** 1.0
**Maintainer:** Peter Abdo + Claude Code

