# 🎨 Pattern Extraction Summary

This document shows what patterns I extracted from your Trade Services Platform wireframe and how they map to landing page components.

## 📊 Wireframe → Landing Page Mapping

### 1. Screen Headers → Hero Component
**Wireframe Pattern:**
```html
<div class="screen-header">
  <h2>Dashboard</h2>
  <p>Overview of your operations</p>
</div>
```

**Extracted to:** `Hero.tsx`
- Title + subtitle layout
- Full-width section
- CTA button placement
- Centered/left alignment variants

---

### 2. Stat Boxes → StatCard Component
**Wireframe Pattern:**
```html
<div class="stat-box green">
  <div class="stat-label">Available Techs</div>
  <div class="stat-number">48</div>
  <div class="stat-label">85% compliant</div>
</div>
```

**Gradient Variants:**
- Purple: `#667eea → #764ba2`
- Green: `#84fab0 → #8fd3f4`
- Orange: `#fa709a → #fee140`
- Blue: `#30cfd0 → #330867`

**Extracted to:** `StatCard.tsx`
- 4 color variants
- Label, value, subtext structure
- Center-aligned text
- Hover effects

---

### 3. Grid Layouts → FeatureSection Component
**Wireframe Pattern:**
```html
<div class="grid grid-3">
  <!-- 3-column responsive grid -->
</div>

<div class="grid grid-2">
  <!-- 2-column responsive grid -->
</div>
```

**Extracted to:** `FeatureSection.tsx`
- 2-column and 3-column layouts
- Responsive breakpoints
- Auto-fit grid behavior
- Gap spacing from design tokens

---

### 4. Wireframe Boxes → Feature Cards
**Wireframe Pattern:**
```html
<div class="wireframe-box">
  <h3>📍 Jobs & Technicians Map</h3>
  <div>Feature content...</div>
</div>
```

**Extracted to:** `FeatureCard.tsx` + `FeatureSection.tsx`
- Icon + title + description layout
- Container background/border from globals.css
- Hover states (background + border changes)
- Click handlers for interactive cards

---

### 5. Action Buttons → CTA Components
**Wireframe Pattern:**
```html
<div class="action-buttons">
  <button class="btn btn-primary">+ Post New Job</button>
  <button class="btn btn-secondary">Import CSV</button>
</div>
```

**Extracted to:** `CTASection.tsx` + Button styles in all components
- Primary button (solid background)
- Secondary button (outline style)
- Flex layout with gap
- Hover effects (translateY, shadow)

---

### 6. Timeline Items → Feature Lists
**Wireframe Pattern:**
```html
<div class="timeline-item">
  <strong>Job #1234 assigned to John Smith</strong>
  <p>5 minutes ago</p>
</div>
```

**Can be used for:**
- Feature lists
- Benefits lists
- Activity feeds
- Step-by-step guides

---

## 🎨 Design Token Mapping

### From Wireframe CSS → globals.css

| Wireframe Style | globals.css Token | Usage |
|----------------|-------------------|--------|
| `background: #f8fafc` | `--container-bg` | Feature cards, sections |
| `border: 2px dashed #cbd5e1` | `--container-border` | Card borders |
| `border-radius: 8px` | `--container-border-radius` | All rounded corners |
| `padding: 20px` | `--spacing-xl` | Container padding |
| `gap: 20px` | `--spacing-xl` | Grid gaps |
| `font-size: 2rem` | `--font-3xl` | Section titles |
| Stat gradients | Custom per variant | StatCard backgrounds |

---

## 📐 Layout Patterns Extracted

### Section Spacing
```
Hero:      80px vertical (--spacing-5xl)
Stats:     64px vertical (--spacing-5xl)
Features:  64px vertical (--spacing-5xl)
CTA:       80px vertical (--spacing-5xl)
```

### Grid Patterns
```
3-column: minmax(250px, 1fr)
2-column: minmax(300px, 1fr)
Gap: 24px (--spacing-xl)
```

### Responsive Breakpoints
```
Mobile:  768px (single column)
Tablet:  1024px (2 columns)
Desktop: 1200px max-width
```

---

## 🎯 Component Usage Patterns

### Pattern 1: Dashboard-Style Stats
```tsx
<StatCard variant="purple" label="Active Jobs" value={24} />
<StatCard variant="green" label="Available Techs" value={48} />
<StatCard variant="orange" label="Pending" value={7} />
```

### Pattern 2: Feature Grid
```tsx
<FeatureSection
  title="Platform Features"
  columns={3}
  features={[
    { title: "...", description: "...", icon: "📋" },
    { title: "...", description: "...", icon: "👷" }
  ]}
/>
```

### Pattern 3: CTA with Description
```tsx
<CTASection
  title="Ready to get started?"
  description="Join thousands of businesses"
  primaryButton={{ text: "Sign Up", onClick: () => {} }}
/>
```

---

## 🔍 Key Design Decisions

### Why These Components?
1. **Hero** - Every landing page needs a header
2. **StatCard** - Dashboard metrics translate to social proof
3. **FeatureSection** - Wireframe boxes → feature showcases
4. **CTASection** - Action buttons → conversion sections
5. **FeatureCard** - Reusable building block

### Design Consistency
- All colors from `globals.css`
- All spacing from design tokens
- Typography scale maintained
- Hover states consistent
- Mobile-responsive patterns

### Flexibility
- Multiple variants per component
- Optional props for customization
- Composable architecture
- Can mix and match

---

## ✨ What You Can Build

With these components, you can create:

✅ **Product Landing Pages**
- Hero + Features + CTA

✅ **Marketing Pages**
- Hero + Stats + Features + Testimonials + CTA

✅ **Feature Showcase Pages**
- Hero + Multi-section features + CTA

✅ **Simple CTAs**
- Just Hero + CTA

✅ **Complex Layouts**
- Multiple sections with mixed patterns

---

## 🚀 Next Steps

1. ✅ Skill created with 5 components
2. ✅ Example landing page included
3. ✅ Design tokens aligned with globals.css
4. ✅ Responsive breakpoints included

**Now you can tell Claude:**
```
"Create a landing page with Hero, 3 stat cards, and feature section"
```

And he'll use these components automatically! 🎉

---

**Extracted by Claude Code** • November 2, 2025
