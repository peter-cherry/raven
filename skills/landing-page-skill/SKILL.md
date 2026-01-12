# Landing Page Skill

A complete design system for creating beautiful landing pages using the Ravensearch design tokens from `globals.css`.

**Extracted from**: Trade Services Platform Wireframe
**Design Tokens**: `globals.css`
**Created**: November 2025

---

## 📦 Components

### 1. Hero Section
Large header section with title, subtitle, and CTA button.

**Design Tokens Used:**
- Background: `var(--bg-primary)` (#2F2F2F)
- Title font: `var(--font-section-title)` (Futura, 32px, 700 weight)
- Text color: `var(--text-primary)` (#FFFFFF)
- Accent: `var(--accent-primary)` (#656290)

**Props:**
- `title` (string) - Main heading
- `subtitle` (string) - Subheading text
- `ctaText` (string) - Call-to-action button text
- `ctaLink` (string) - Button link/action
- `backgroundImage` (string, optional) - Background image URL
- `height` (string, default: '600px') - Hero section height

**Example:**
```tsx
<Hero
  title="Connect with Qualified Technicians"
  subtitle="Find HVAC, plumbing, and electrical experts in minutes"
  ctaText="Get Started"
  ctaLink="/signup"
  height="600px"
/>
```

---

### 2. StatCard
Display key metrics with large numbers and labels (extracted from dashboard stat boxes).

**Design Tokens Used:**
- Background: `var(--container-bg)` (rgba(178, 173, 201, 0.05))
- Border: `var(--container-border)` (rgba(249, 243, 229, 0.33))
- Border radius: `var(--container-border-radius)` (8px)
- Number size: `var(--font-4xl)` (36px)
- Label size: `var(--font-md)` (13px)

**Props:**
- `number` (string | number) - The metric value
- `label` (string) - Description of the metric
- `sublabel` (string, optional) - Additional context
- `accentColor` (string, optional) - Custom accent color

**Example:**
```tsx
<StatCard
  number="24"
  label="Active Jobs"
  sublabel="↑ 12% from last week"
/>
```

---

### 3. FeatureCard
Card component for showcasing features with icon, title, and description.

**Design Tokens Used:**
- Background: `var(--container-bg)`
- Border: `var(--container-border)`
- Border radius: `var(--container-border-radius)`
- Hover bg: `var(--container-hover-bg)`
- Title: `var(--font-text-title-size)` (14px)
- Body: `var(--font-text-body-size)` (12px)
- Icon size: `var(--icon-size-lg)` (24px)

**Props:**
- `icon` (ReactNode) - Icon element
- `title` (string) - Feature title
- `description` (string) - Feature description
- `ctaText` (string, optional) - Call-to-action text
- `ctaLink` (string, optional) - Call-to-action link

**Example:**
```tsx
<FeatureCard
  icon={<SearchIcon />}
  title="Smart Matching"
  description="AI-powered matching connects you with the right technician"
  ctaText="Learn More"
  ctaLink="/features/matching"
/>
```

---

### 4. FeatureGrid
Grid layout for displaying multiple features (2 or 3 columns).

**Design Tokens Used:**
- Gap: `var(--spacing-xl)` (24px)
- Responsive breakpoints from `globals.css`

**Props:**
- `columns` (2 | 3, default: 3) - Number of columns
- `children` (ReactNode) - FeatureCard components

**Example:**
```tsx
<FeatureGrid columns={3}>
  <FeatureCard {...feature1} />
  <FeatureCard {...feature2} />
  <FeatureCard {...feature3} />
</FeatureGrid>
```

---

### 5. CTASection
Full-width call-to-action section with title, description, and button.

**Design Tokens Used:**
- Background: `var(--container-bg)`
- Border: `var(--container-border)`
- Padding: `var(--spacing-5xl)` (64px)
- Button: `var(--accent-primary)` background
- Button text: `var(--btn-text-color)`

**Props:**
- `title` (string) - CTA heading
- `description` (string) - Supporting text
- `buttonText` (string) - Button label
- `buttonLink` (string) - Button destination
- `centered` (boolean, default: true) - Center alignment

**Example:**
```tsx
<CTASection
  title="Ready to Get Started?"
  description="Join hundreds of service providers using our platform"
  buttonText="Sign Up Now"
  buttonLink="/signup"
/>
```

---

### 6. PageSection
Reusable section wrapper with consistent spacing and optional background.

**Design Tokens Used:**
- Padding: `var(--spacing-5xl)` (64px vertical)
- Max width: 1400px
- Background options from design tokens

**Props:**
- `children` (ReactNode) - Section content
- `background` ('primary' | 'secondary' | 'transparent', default: 'transparent')
- `spacing` ('sm' | 'md' | 'lg' | 'xl', default: 'xl')
- `className` (string, optional) - Additional classes

**Example:**
```tsx
<PageSection background="primary" spacing="xl">
  <h2>Our Features</h2>
  <FeatureGrid columns={3}>
    {features}
  </FeatureGrid>
</PageSection>
```

---

## 🎨 Design Tokens Reference

All tokens from `globals.css` used in landing pages:

### Colors
```css
--bg-primary: #2F2F2F
--bg-secondary: #2F2F2F
--accent-primary: #656290
--accent-secondary: #8083AE
--text-primary: #FFFFFF
--text-secondary: #A0A0A8
--border-subtle: #656290
--success: #10B981
--warning: #F59E0B
--error: #EF4444
```

### Container Styling
```css
--container-bg: rgba(178, 173, 201, 0.05)
--container-border: 1px solid rgba(249, 243, 229, 0.33)
--container-border-radius: 8px
--container-hover-bg: rgba(178, 173, 201, 0.15)
```

### Typography Scale
```css
--font-xs: 10px
--font-sm: 11px
--font-md: 13px
--font-lg: 16px
--font-xl: 18px
--font-2xl: 20px
--font-3xl: 28px
--font-4xl: 36px

--font-section-title: 'Futura'
--font-section-title-size: 32px
--font-section-title-weight: 700
--font-text-body: 'Inter'
```

### Spacing Scale
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

### Buttons
```css
--btn-corner-radius: 6px
--btn-text-color: #CCCCCC
--btn-text-color-hover: #FFFFFF
--btn-text-padding: 12px 32px
--btn-text-font-size: 18px
--transition-hover: 0.2s
```

---

## 📐 Layout Patterns

### Standard Landing Page Structure
```
┌─────────────────────────────────────┐
│         HERO SECTION                │
│    Title + Subtitle + CTA           │  ← Height: 600px
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│      STATS SECTION (Optional)       │
│    3-column stat cards              │  ← Spacing: 64px top/bottom
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│       FEATURES SECTION              │
│    Title + Feature Grid             │  ← Spacing: 64px top/bottom
│    (3 columns on desktop)           │
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│       FEATURES SECTION 2            │
│    Alternative layout               │  ← Spacing: 64px top/bottom
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│         CTA SECTION                 │
│    Final conversion prompt          │  ← Spacing: 64px top/bottom
│                                     │
└─────────────────────────────────────┘
```

### Spacing Guidelines
- **Section padding**: 64px (--spacing-5xl) top and bottom
- **Section gap**: 0px (sections are back-to-back)
- **Card gaps**: 24px (--spacing-xl)
- **Content max-width**: 1400px
- **Hero height**: 600px (adjustable)

### Responsive Breakpoints
```css
/* Desktop: 3 columns */
@media (min-width: 1024px) {
  grid-template-columns: repeat(3, 1fr);
}

/* Tablet: 2 columns */
@media (min-width: 768px) and (max-width: 1023px) {
  grid-template-columns: repeat(2, 1fr);
}

/* Mobile: 1 column */
@media (max-width: 767px) {
  grid-template-columns: 1fr;
}
```

---

## 🎯 Usage Instructions

### Basic Landing Page
```
Create a landing page with:
- Hero section: "Your Title" / "Your subtitle" / "CTA Button"
- 3 feature cards in a grid
- CTA section at the bottom
```

### With Stats
```
Create a landing page with:
- Hero section
- 3 stat cards showing key metrics
- 3 feature cards
- CTA section
```

### Custom Layout
```
Create a landing page with:
- Hero: 600px height, dark background
- 2-column feature grid (left side with image)
- 3-column feature cards
- CTA with accent background
```

---

## 📝 Component Checklist

When creating a landing page, Claude should:

✅ Use `globals.css` design tokens for all colors, spacing, and typography
✅ Import components from the landing-page-skill folder
✅ Follow the standard layout structure (Hero → Stats/Features → CTA)
✅ Apply responsive breakpoints for mobile, tablet, and desktop
✅ Use semantic HTML (main, section, article, etc.)
✅ Include hover states on interactive elements
✅ Ensure 64px vertical spacing between sections
✅ Center content with max-width: 1400px
✅ Use Futura for headings, Inter for body text
✅ Apply consistent border-radius (8px for cards, 6px for buttons)

---

**Built with Claude Code** 🤖
Ready to create beautiful landing pages! ✨
