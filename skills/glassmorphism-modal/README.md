# Glassmorphism Modal Skill

A complete design system for creating beautiful glassmorphic modals with blur effects, animated progress timelines, and expandable containers.

**Based on**: Raven Search Dispatch Loader v2.0
**Design Tokens**: `/app/design-tokens.css`
**Last Updated**: October 30, 2025

---

## 📦 Components

### 1. GlassmorphicModal
Main modal wrapper with backdrop blur and semi-transparent background.

**Props:**
- `isOpen` (boolean) - Control modal visibility
- `onClose` (function) - Close handler
- `width` (number, default: 915) - Modal width in pixels
- `height` (number, default: 800) - Modal height in pixels
- `showCloseButton` (boolean, default: true) - Show/hide close X button
- `backgroundImage` (string) - Background image URL
- `backgroundOpacity` (number, default: 0.2) - Background image opacity
- `backgroundBlur` (string, default: '4px') - Background blur amount
- `animateFrom` (object, optional) - Initial animation position/size

**Example:**
```tsx
import GlassmorphicModal from '@/skills/glassmorphism-modal/components/GlassmorphicModal';

<GlassmorphicModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  width={915}
  height={800}
>
  <YourContent />
</GlassmorphicModal>
```

---

### 2. ExpandableContainer
Container with expand/collapse functionality and fade gradient.

**Props:**
- `collapsedHeight` (number, default: 120) - Height when collapsed
- `expandedHeight` (number, default: 240) - Height when expanded
- `collapsedWidth` (number, optional) - Width when collapsed
- `expandedWidth` (number, optional) - Width when expanded
- `showExpandButton` (boolean, default: true) - Show chevron toggle
- `showFadeGradient` (boolean, default: true) - Show bottom fade when collapsed
- `defaultExpanded` (boolean, default: false) - Initial expanded state
- `onExpandChange` (function, optional) - Callback when state changes
- `className` (string, optional) - Additional CSS classes
- `style` (object, optional) - Inline styles

**Example:**
```tsx
import ExpandableContainer from '@/skills/glassmorphism-modal/components/ExpandableContainer';

<ExpandableContainer
  collapsedHeight={120}
  expandedHeight={240}
  showFadeGradient={true}
>
  <div style={{ padding: 16 }}>
    <p>Your content here...</p>
  </div>
</ExpandableContainer>
```

---

### 3. ProgressTimeline
Vertical timeline with animated dots, lines, and icons.

**Props:**
- `steps` (ProgressStep[]) - Array of step objects
- `currentStepIndex` (number) - Index of current active step
- `stepSpacing` (number, default: 35) - Vertical spacing between steps
- `dotSize` (number, default: 8) - Size of timeline dots
- `lineWidth` (number, default: 2) - Width of connecting lines
- `lineHeight` (number, default: 17) - Height of connecting lines
- `iconSize` (number, default: 18) - Size of step icons
- `showIcons` (boolean, default: true) - Show/hide icons
- `showShimmer` (boolean, default: true) - Shimmer effect on active step

**ProgressStep Interface:**
```typescript
interface ProgressStep {
  key: string;
  label: string;
  icon?: ReactNode;
  fontWeight?: number;
}
```

**Example:**
```tsx
import ProgressTimeline from '@/skills/glassmorphism-modal/components/ProgressTimeline';

const steps = [
  {
    key: 'created',
    label: 'Work order Created',
    fontWeight: 500,
    icon: <CheckIcon />
  },
  {
    key: 'searching',
    label: 'Searching for Technicians',
    icon: <SearchIcon />
  }
];

<ProgressTimeline
  steps={steps}
  currentStepIndex={1}
  showShimmer={true}
/>
```

---

## 🎨 Design Tokens

All design tokens are defined in `/app/design-tokens.css` under the `/* === OVERLAY MODAL / GLASSMORPHISM CARD === */` section.

### Key Tokens:

#### Modal Background & Effects
```css
--modal-bg: rgba(47, 47, 47, 0.3);
--modal-backdrop-blur: blur(12px);
--modal-border: 1px solid rgba(154, 150, 213, 0.3);
--modal-border-radius: 16px;
--modal-shadow: 0px 0px 22.9px rgba(0, 0, 0, 0.21);
--modal-padding: 40px;
```

#### Container Backgrounds
```css
--container-bg: rgba(178, 173, 201, 0.05);
--container-border: 1px solid rgba(249, 243, 229, 0.11);
--container-border-radius: 8px;
--container-hover-bg: rgba(178, 173, 201, 0.15);
--container-hover-border: rgba(249, 243, 229, 0.3);
```

#### Typography
```css
/* Section Titles */
--font-section-title: 'Futura', sans-serif;
--font-section-title-size: 32px;
--font-section-title-weight: 700;

/* Text Content */
--font-text-title: 'Inter', sans-serif;
--font-text-title-size: 14px;
--font-text-body-size: 12px;

/* Progress Steps */
--font-progress-step: 'Inter', sans-serif;
--font-progress-step-size: 14px;
--font-progress-step-weight: 400;
```

#### Progress Step Elements
```css
--progress-dot-size: 8px;
--progress-dot-color: #BAB3C4;
--progress-line-width: 2px;
--progress-line-height: 16px;                    /* Connecting line height */
--progress-line-color: rgba(249, 243, 229, 0.33); /* Cream color */
--progress-line-gap: 16px;                       /* Gap between icon and line */
--progress-icon-size: 22.5px;                    /* Icon size (25% larger) */
--progress-step-spacing: 70.5px;                 /* Total spacing between icons */
--progress-icon-text-gap: 16.5px;                /* Gap between icon and text */
--progress-text-size: 14px;
--progress-line-animation-duration: 0.8s;        /* Slower line animation */
```

#### Colors
```css
--text-primary: #FFFFFF;
--text-secondary: #BAB3C4;
--text-hover: #CDCDE5;
--icon-progress-step: rgba(249, 243, 229, 0.33); /* Matches container borders */
--icon-zoom-controls: rgba(249, 243, 229, 0.33);
```

#### Animations
```css
--transition-expand: 0.3s ease;
--transition-hover: 0.2s;
--progress-line-animation-duration: 0.8s;        /* Line extension animation */
```

**Keyframes:**
- `@keyframes shimmer` - Text shimmer for loading states
- `@keyframes flicker` - Border flicker for typing indicators
- `@keyframes blink` - Cursor blink animation

---

## 🚀 Complete Example

Here's a full example combining all components:

```tsx
'use client';

import { useState } from 'react';
import GlassmorphicModal from '@/skills/glassmorphism-modal/components/GlassmorphicModal';
import ExpandableContainer from '@/skills/glassmorphism-modal/components/ExpandableContainer';
import ProgressTimeline from '@/skills/glassmorphism-modal/components/ProgressTimeline';

export default function DispatchLoader() {
  const [showModal, setShowModal] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      key: 'created',
      label: 'Work order Created and added to jobs list',
      fontWeight: 500,
      icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M14 5L7 12L4 9" stroke="#6D699E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    },
    {
      key: 'searching',
      label: 'Searching for Matching Electricians',
      icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="7.5" cy="7.5" r="4.5" stroke="#6D699E" strokeWidth="1.5"/>
        <path d="M11 11L15 15" stroke="#6D699E" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    },
    {
      key: 'reached',
      label: '45 Electricians Reached',
      icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="5.5" r="2.5" stroke="#6D699E" strokeWidth="1.5"/>
        <path d="M4 15C4 12 5.5 10 9 10C12.5 10 14 12 14 15" stroke="#6D699E" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    }
  ];

  return (
    <GlassmorphicModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      width={915}
      height={800}
    >
      {/* Work Order Number */}
      <div style={{
        position: 'absolute',
        top: 45,
        left: 45,
        fontFamily: 'Futura, sans-serif',
        fontSize: 32,
        fontWeight: 700,
        color: '#FFFFFF'
      }}>
        WO-2025-001
      </div>

      {/* Work Order Text Container */}
      <div style={{ position: 'absolute', top: 102, left: 45 }}>
        <ExpandableContainer
          collapsedHeight={120}
          expandedHeight={240}
          collapsedWidth={400}
        >
          <div style={{ padding: 16, color: '#FFFFFF', fontSize: 12 }}>
            <strong>Emergency HVAC Repair</strong>
            <p>AC unit not cooling. Customer reports strange noises...</p>
          </div>
        </ExpandableContainer>
      </div>

      {/* Progress Timeline */}
      <div style={{ position: 'absolute', top: 102, left: 470 }}>
        <ExpandableContainer
          collapsedHeight={240}
          expandedHeight={240}
          collapsedWidth={400}
          showExpandButton={false}
        >
          <div style={{ padding: 16 }}>
            <div style={{
              fontFamily: 'Futura, sans-serif',
              fontSize: 16,
              fontWeight: 500,
              color: '#FFFFFF',
              marginBottom: 20
            }}>
              Dispatch Progress
            </div>
            <ProgressTimeline
              steps={steps}
              currentStepIndex={currentStep}
              showShimmer={true}
            />
          </div>
        </ExpandableContainer>
      </div>
    </GlassmorphicModal>
  );
}
```

---

## 📐 Layout Guidelines

### Modal Structure
```
┌─────────────────────────────────────────┐
│  [X]                                    │  ← Close button (top: 20, right: 20)
│                                         │
│  WO-2025-001                            │  ← Section title (top: 45, left: 45)
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │ WO Text  │  │ Progress │           │  ← Containers (25px gap)
│  │ 400×120  │  │ 400×240  │           │
│  └──────────┘  └──────────┘           │
│                                         │
│  ┌──────────┐                          │
│  │   Map    │                          │  ← Map container (25px gap below)
│  │ 400×267  │                          │
│  └──────────┘                          │
│                                         │
└─────────────────────────────────────────┘
```

### Spacing Tokens
- Modal padding: `40px`
- Section header to content: `25px`
- Between containers: `25px`
- Container internal padding: `16px`

---

## 🎯 Use Cases

1. **Dispatch Loader** - Show work order dispatch progress with live updates
2. **Order Tracker** - Display multi-step order fulfillment status
3. **Onboarding Flow** - Guide users through setup steps
4. **Upload Progress** - Show file upload/processing stages
5. **Form Wizard** - Multi-step form with visual progress
6. **Notification Center** - Expandable notification cards

---

## ⚙️ Customization

### Changing Colors

Edit `/app/design-tokens.css`:

```css
:root {
  --modal-bg: rgba(47, 47, 47, 0.3);  /* Change modal background */
  --container-bg: rgba(178, 173, 201, 0.05);  /* Change container background */
  --text-primary: #FFFFFF;  /* Change text color */
}
```

### Adding Custom Animations

Add new keyframes to design tokens:

```css
@keyframes yourAnimation {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

Then use in components:
```tsx
style={{ animation: 'yourAnimation 1s ease-in-out' }}
```

---

## 🧪 Testing

```bash
# Start dev server
npm run dev

# Test modal opening/closing
# Test container expansion
# Test progress timeline animations
```

---

## 📚 Dependencies

Required packages:
- `framer-motion` - For smooth animations
- `react` - React 18+
- `typescript` - For type safety

---

## 🔗 Related Files

- Design Tokens: `/app/design-tokens.css`
- Implementation Example: `/app/page.tsx` (lines 614-1230)
- Dispatch Loader Spec: `/DISPATCH_LOADER_2.0_SPECIFICATION.md`

---

## 🤝 Contributing

When adding new components:
1. Extract design tokens to `/app/design-tokens.css`
2. Create component in `/skills/glassmorphism-modal/components/`
3. Add usage example to this README
4. Update TypeScript interfaces
5. Test animations and transitions

---

## 📝 License

Proprietary - Raven Search

---

**Built with Claude Code** 🤖
Ready to create beautiful glassmorphic UIs! ✨
