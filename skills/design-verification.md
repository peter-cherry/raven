# 🎨 Design Verification Checklist

Use this checklist when making ANY visual/UI changes to ensure design consistency.

## Pre-Work: Understand the Design System

- [ ] **Read globals.css** - Check what CSS variables and values exist
- [ ] **Find similar components** - Look for existing components with similar styling
- [ ] **Match exact styles** - Use the same colors, borders, spacing as reference components
- [ ] **Note design patterns** - Glassmorphic? Flat? Bordered? Match the existing pattern

## During Work: Apply Styles Correctly

- [ ] **Use exact color values** - Don't guess, copy from existing components
- [ ] **Match typography** - Font family, size, weight should be identical to similar elements
- [ ] **Copy spacing/padding** - Use the same padding, margin, gaps as reference
- [ ] **Maintain visual hierarchy** - Ensure new elements fit the visual order (headings > subheadings > body)

## Component-Specific Patterns

### Glassmorphic Purple Components (tech cards, search bars)
- Background: `rgba(122, 123, 154, 0.78)`
- Border: `2px solid #A1A3B9`
- Border radius: `10px`
- Backdrop blur: `blur(12px)`
- Box shadow: `0 4px 4px rgba(0,0,0,0.24)`

### Modal/Overlay Components
- Background: `var(--modal-bg)` - `rgba(47, 47, 47, 0.3)`
- Border: `var(--modal-border)` - `1px solid rgba(249, 243, 229, 0.33)` (cream)
- Border radius: `var(--modal-border-radius)` - `16px`
- Backdrop blur: `var(--modal-backdrop-blur)` - `blur(12px)`

### Container/Card Elements
- Background: `var(--container-bg)` - `rgba(178, 173, 201, 0.05)` (light purple tint)
- Border: `var(--container-border)` - `1px solid rgba(249, 243, 229, 0.33)` (cream)
- Border radius: `var(--container-border-radius)` - `8px`
- Hover background: `var(--container-hover-bg)` - `rgba(178, 173, 201, 0.15)`

### Interactive States
- Default: Container bg + cream border
- Hover: Brighter container bg + accent border
- Active/Selected: Accent border (`var(--accent-primary)` - `#656290`)
- Disabled: Lower opacity (0.5-0.6)

## Post-Work: Verify Changes

- [ ] **Compile check** - Ensure no TypeScript/build errors
- [ ] **Read the updated file** - Re-read to confirm changes applied correctly
- [ ] **Ask user for visual confirmation** - "Please check [component] in browser at [URL] and confirm it matches the design"
- [ ] **Test all states** - Ask user to test hover, click, active states
- [ ] **Mobile responsive** - Ask if mobile view needs checking

## Designer Lingo Translation

| Designer Says | Means |
|--------------|-------|
| "Glassmorphic" | Translucent background + backdrop blur |
| "Stroke" | Border |
| "Fill" | Background color |
| "Elevation" | Box shadow (depth effect) |
| "Spacing" | Padding and margin |
| "Hierarchy" | Visual importance (size, weight, color contrast) |
| "State" | Hover, active, focus, disabled appearance |
| "Subtle" | Low opacity, light color (often cream/white at 0.33 opacity) |
| "Accent" | Primary brand color (purple #656290) |
| "Muted" | Reduced saturation/opacity text color |

## Common Design Mistakes to Avoid

❌ Using generic CSS variable names without checking their actual values
❌ Assuming all borders should be the same color
❌ Forgetting hover/active states
❌ Not matching border radius to component type
❌ Mixing design patterns (glassmorphic + flat in same context)
❌ Skipping visual browser verification

✅ Copy exact values from similar existing components
✅ Test in browser before marking complete
✅ Maintain consistency within the same page/section
✅ Ask user to confirm visual appearance

## Quick Reference: Common Values

**Colors:**
- White text: `#FFFFFF` or `var(--text-primary)`
- Muted text: `#A0A0A8` or `var(--text-secondary)`
- Purple accent: `#656290` or `var(--accent-primary)`
- Cream border: `rgba(249, 243, 229, 0.33)` or `var(--stroke-subtle)`
- Purple glass: `rgba(122, 123, 154, 0.78)`
- Light purple border: `#A1A3B9`

**Spacing:**
- Tight gap: `8px` or `var(--spacing-sm)`
- Standard gap: `12px` or `var(--spacing-md)`
- Section spacing: `24px` or `var(--spacing-xl)`
- Large section: `32px` or `var(--spacing-2xl)`

**Typography:**
- Section titles: `32px` Futura Bold
- Headings: `18px` Inter Bold
- Body text: `13-15px` Inter Regular
- Small text: `12px` Inter Regular

---

**Remember:** When in doubt, find a similar component and match it exactly! 🎯
