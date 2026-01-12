# 🚀 Landing Page Skill - Cheat Sheet

Quick reference for using the landing page skill with Claude.

## 📝 Tell Claude Every Time

```
"Read landing-page-skill/SKILL.md and create [your request]"
```

## ⚡ Quick Commands

### Basic Landing Page
```
"Create a landing page with Hero section, 3 stat cards, and CTA"
```

### Feature Showcase
```
"Build a landing page with Hero, 6 features in 3 columns, and CTA"
```

### Stats Page
```
"Create a landing page with Hero and 4 stat cards showing our metrics"
```

### Full Landing Page
```
"Create a complete landing page with:
- Hero: 'Product Name' with primary and secondary CTA
- Stats section with 3 metrics
- Feature section with 6 features
- Final CTA section"
```

---

## 🎨 Component Quick Reference

### Hero
```tsx
<Hero
  title="Your Title"
  subtitle="Your subtitle"
  primaryCTA={{ text: "Get Started", onClick }}
  secondaryCTA={{ text: "Learn More", onClick }}
  variant="centered" // or "left"
/>
```

### StatCard
```tsx
<StatCard
  label="Active Jobs"
  value={24}
  subtext="↑ 12% from last week"
  variant="purple" // or "green", "orange", "blue"
/>
```

### FeatureSection
```tsx
<FeatureSection
  title="Platform Features"
  subtitle="Everything you need"
  columns={3} // or 2
  features={[
    { title: "...", description: "...", icon: "📋" }
  ]}
/>
```

### CTASection
```tsx
<CTASection
  title="Ready to get started?"
  description="Join thousands"
  primaryButton={{ text: "Sign Up", onClick }}
  secondaryButton={{ text: "Learn More", onClick }}
/>
```

---

## 🎯 Variants Cheat Sheet

### StatCard Colors
- `purple` - Default gradient
- `green` - Success/positive metrics
- `orange` - Warning/attention metrics
- `blue` - Info/cold metrics

### Hero Alignment
- `centered` - Text centered (default)
- `left` - Text left-aligned

### FeatureSection Layout
- `grid` - Grid layout (default)
- `list` - Stacked list
- `columns={2}` - 2 columns
- `columns={3}` - 3 columns

### CTA Size
- `default` - Full size (default)
- `compact` - Smaller padding

---

## 🗣️ Natural Language Examples

### Example 1
**You say:**
```
"Create a landing page for a trade services app with a hero section,
3 stat cards (jobs, techs, matches), and a feature grid showing
job management, technician network, and tracking"
```

**Claude will:**
- Use Hero component
- Create 3 StatCards with appropriate variants
- Build FeatureSection with 3 features
- Apply design tokens from globals.css

### Example 2
**You say:**
```
"Build a simple landing page with just a hero and CTA"
```

**Claude will:**
- Use Hero component
- Use CTASection component
- Skip stats and features
- Keep it minimal

### Example 3
**You say:**
```
"Make a landing page with hero, 4 stat cards, 6 features in 2 columns, and a CTA"
```

**Claude will:**
- Hero at top
- 4 StatCards in responsive grid
- FeatureSection with columns={2}
- CTASection at bottom

---

## 📊 Layout Tips

### Section Order (Recommended)
1. Hero
2. Stats (optional)
3. Features
4. Social Proof (optional)
5. CTA

### Spacing
- Use `var(--spacing-5xl)` for section padding
- Use `var(--spacing-xl)` for grid gaps
- Use `var(--spacing-3xl)` for horizontal padding

### Max Width
- Content sections: `1200px`
- Text sections: `800px`
- Compact sections: `600px`

---

## ⚙️ Customization Quick Tips

### Adding Icons
```
Icon can be:
- Emoji: "📋"
- SVG element: <YourIcon />
- Image: <img src="..." />
```

### Custom Colors
Use globals.css tokens:
```css
--accent-primary: #656290
--success: #10B981
--warning: #F59E0B
--error: #EF4444
```

### Responsive Behavior
All components are responsive by default:
- Mobile: Single column
- Tablet: 2 columns
- Desktop: 3 columns

---

## ✅ Checklist

Before telling Claude to create a landing page:

- [ ] Mention the skill: "using landing-page-skill"
- [ ] Specify sections: Hero, Stats, Features, CTA
- [ ] Provide content or ask Claude to generate it
- [ ] Mention specific variants if needed

---

## 🔗 File Locations

- **Documentation:** `landing-page-skill/SKILL.md`
- **Example:** `landing-page-skill/LandingPageExample.tsx`
- **Components:** `landing-page-skill/components/`
- **Design Tokens:** `globals.css`

---

## 💡 Pro Tips

1. **Always read the skill first** - Tell Claude to read SKILL.md
2. **Be specific** - "3 stat cards" not "some stats"
3. **Mention variants** - "purple stat card" not just "stat card"
4. **Reference the example** - "like in LandingPageExample.tsx"
5. **Use design tokens** - Claude knows to use globals.css

---

**Quick Start:**
```
"Read landing-page-skill/SKILL.md then create a landing page
with Hero, 3 stats, and 6 features"
```

**That's it!** 🎉
