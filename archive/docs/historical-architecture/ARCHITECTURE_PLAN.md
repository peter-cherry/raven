> Archived on 2026-01-12 from ARCHITECTURE_PLAN.md. Reason: Implemented architecture plan - marked complete Nov 2025

# Raven Search - Single-Page Architecture Plan

## Overview
The application is being restructured to use a **single-page overlay architecture** where the hero section (search page) remains persistent as the background for the entire application experience.

## Architecture Principles

### 1. **Hero Section Persistence**
- The `/` (home/search) page serves as the **permanent background** for the entire application
- The hero section includes:
  - Map background
  - Search bar with "Create WO" functionality
  - Side navigation
  - Persistent UI elements

### 2. **Overlay Card System**
All other pages/sections render as **floating overlay cards** on top of the hero background:
- Jobs List
- Compliance
- Other sections (to be implemented)

### 3. **Navigation Behavior**
- Clicking navigation items does NOT navigate to new routes
- Instead, it shows/hides overlay cards on the same page
- Technicians page remains as a separate route (for now)

## Implementation Details

### Jobs List Overlay
**Trigger**: Click "Jobs List" button in navigation
**Behavior**:
- Floating modal-style card appears over hero background
- Card is centered/positioned appropriately
- Contains the jobs list grid view from `/jobs` page
- Has exit (X) button to close and return to hero

**Design Specs**:
- Card dimensions: 615px × 772px
- Position: Centered or specific coordinates
- Background: `rgba(245, 245, 245, 0.05)`
- Border: `2px solid rgba(101, 98, 144, 0.31)`
- Contains all job cards with search functionality

### Compliance Overlay
**Trigger**: Click "Compliance" icon in navigation
**Behavior**:
- Card appears as overlay on hero background
- **Background blur applied** to hero section when card is visible
- **Backdrop blur** applied to the compliance card itself

**Design Specs**:
- Hero background blur: `backdrop-filter: blur(8px)` or similar
- Compliance card backdrop: `backdrop-filter: blur(12px)`
- Semi-transparent background to show blur effect

### Technicians Page
**Status**: Keep as-is (separate route) for now
**Route**: `/technicians`
**Behavior**: Traditional page navigation (not overlay)

## Technical Implementation Plan

### Phase 1: State Management
1. Create global state for overlay management
2. Add state variables:
   - `activeOverlay`: 'none' | 'jobs' | 'compliance' | ...
   - `isOverlayOpen`: boolean

### Phase 2: Hero Page Modifications
1. Update `/app/page.tsx` to:
   - Include overlay card components
   - Add blur state management
   - Handle overlay open/close logic

### Phase 3: Component Extraction
1. Extract Jobs List content from `/app/jobs/page.tsx` into `JobsOverlay` component
2. Extract Compliance content into `ComplianceOverlay` component
3. Each overlay component includes:
   - Exit button handler
   - Proper z-index layering
   - Blur effects where needed

### Phase 4: Navigation Updates
1. Update sidebar navigation to trigger overlay state changes
2. Prevent default navigation for Jobs and Compliance
3. Keep Technicians as traditional link

### Phase 5: Visual Effects
1. Implement blur effect for hero when overlays active
2. Add animation transitions for overlay open/close
3. Ensure proper focus management

## File Structure
```
/app
  /page.tsx                    # Main hero page with overlay system
  /components
    /JobsOverlay.tsx           # Jobs list overlay component
    /ComplianceOverlay.tsx     # Compliance overlay component
  /jobs
    /[id]/page.tsx             # Individual job detail (may also become overlay)
  /technicians
    /page.tsx                  # Separate route (unchanged for now)
```

## Current Status
- ✅ **Jobs page styling** - Updated to Figma specs
- ✅ **Global CSS** - Consistent card styling implemented
- ✅ **Overlay architecture** - ✨ **FULLY IMPLEMENTED**
- ✅ **Component extraction** - JobsOverlay, ComplianceOverlay, ComplianceQuickOverlay created
- ✅ **State management** - `activeOverlay` state in app/page.tsx with Framer Motion
- ✅ **Navigation system** - Sidebar triggers overlays, not routes
- ✅ **Visual effects** - Backdrop blur, glassmorphic styling, ESC key support
- ✅ **CreateJobForm overlay** - Slides from bottom with 200px right offset
- ✅ **Dispatch Loader 2.0** - 915×800px glassmorphic modal with integrated map

## Implementation Complete ✅

All phases have been successfully implemented:
- ✅ **Phase 1**: State management with `activeOverlay` enum
- ✅ **Phase 2**: Hero page modifications with overlay rendering
- ✅ **Phase 3**: Component extraction (JobsOverlay, ComplianceOverlay, CreateJobForm)
- ✅ **Phase 4**: Navigation updates (Sidebar triggers state changes)
- ✅ **Phase 5**: Visual effects (blur, animations, focus management)

### Key Implementation Details
- **Main file**: `app/page.tsx` (847 lines) manages all overlay state
- **Overlays**: Jobs List, Compliance, Compliance Quick, Create Job, Dispatch Loader
- **Routes**: Technicians, Admin, Settings, Auth pages (separate routes as planned)
- **Animations**: Framer Motion with glassmorphic blur effects
- **Keyboard**: ESC key closes all overlays

---
**Last Updated**: 2025-11-01
**Status**: ✅ **PRODUCTION - FULLY IMPLEMENTED**

