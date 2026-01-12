> Archived on 2026-01-12 from NAVIGATION_GUIDE.md. Reason: Review needed - may still be relevant

# 🧭 Raven Search - Navigation Guide

**Welcome to Raven Search!** This platform uses a unique **overlay-based navigation system** designed to keep you oriented and productive.

---

## 🎯 Quick Start: How to Navigate

### The Home Page is Your Hub
When you open Raven Search, you'll land on the **home page** with:
- 🗺️ **Interactive map** showing job locations and technician pins
- 🔍 **Search bar** at the top for quick work order creation
- 📋 **Sidebar** on the left with navigation icons

**This home page stays visible throughout your entire session** - it never disappears!

---

## 🖱️ How to Access Features

### Option 1: Sidebar Icons (Overlays)
Click icons in the left sidebar to open **floating overlay cards**:

| Icon | Feature | What Opens | How to Close |
|------|---------|------------|--------------|
| 🔍 | Search | Home page (default view) | N/A - always visible |
| 🗂️ | Jobs List | Floating 615×772px card with job grid | Press **ESC** or click **X** |
| ✅ | Compliance | Policy management overlay with blur | Press **ESC** or click **X** |
| 👥 | Technicians | **New page** (traditional navigation) | Use browser back |
| ⚙️ | Admin | **New page** (dashboard) | Use browser back |
| 🚪 | Logout | Signs you out | - |

### Option 2: Search Bar (Quick Actions)
- **Type anything** → Opens AI-powered work order form as an overlay
- **Click "Create WO"** → Same as above
- Form slides in from the bottom with a slight right offset

### Option 3: Dispatch Process
- **Create a job** → Automatic dispatch modal appears (915×800px)
- **View progress** → Live map shows technician markers
- **Track responses** → Real-time updates on emails sent/opened

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **ESC** | Close any overlay and return to map |
| **Enter** | Submit forms/searches |

---

## 🎨 Understanding Overlays vs. Pages

### What's an Overlay?
An **overlay** is a floating card that appears **over** the map background:
- ✨ Map stays visible underneath (with blur effect)
- ⚡ Appears instantly (no page load)
- 🎭 Glassmorphic design (semi-transparent with blur)
- 🔄 Returns to map when closed

**Overlays in Raven Search:**
- Jobs List
- Compliance Manager
- Create Job Form
- Dispatch Loader

### What's a Page?
A **page** is a traditional full-screen view that replaces the map:
- 🔄 Browser URL changes
- ⬅️ Use browser back button to return
- 📄 Full page content (no map background)

**Pages in Raven Search:**
- Technicians List & Detail
- Admin Dashboard
- Settings
- Login/Signup

---

## 🗺️ The Map: Your Persistent Context

### Why the Map Stays Visible
The map is the **heart** of Raven Search. It provides constant geographic context:
- 📍 See job locations at a glance
- 👥 View technician proximity
- 🎯 Understand dispatch radius
- 🧭 Stay oriented geographically

### What You'll See on the Map
- **Cream circles with purple border** = Job locations
- **Blue numbered circles** = Technicians (matches dispatch order)
- **Purple roads/buildings** = Custom styled map
- **Interactive** = Click, zoom, pan

---

## 🎬 Common Workflows

### Workflow 1: View All Jobs
1. Click **Jobs List** icon (🗂️) in sidebar
2. Overlay appears with job cards
3. Use search box or filters to narrow down
4. Click a job card to see details
5. Press **ESC** to return to map

### Workflow 2: Create a New Job
1. Click in the search bar at top
2. Paste unstructured work order text OR fill out form
3. AI extracts details (trade, location, urgency, etc.)
4. Review and submit
5. Watch dispatch loader show real-time progress
6. Map updates with job marker and technician pins

### Workflow 3: Manage Compliance
1. Click **Compliance** icon (✅) in sidebar
2. Overlay appears with policy options
3. Choose template (Standard, High-Risk, Basic) OR create custom
4. Set insurance requirements, licenses, certifications
5. Save policy
6. Press **ESC** to close

### Workflow 4: View Technicians
1. Click **Technicians** icon (👥) in sidebar
2. **Full page loads** (not an overlay)
3. Browse technician list
4. Click a technician to see profile
5. Use **browser back button** to return

---

## 💡 Pro Tips

### Tip 1: Keep the Map Visible
When working with jobs, keep overlays open to see geographic context. The map shows you where jobs are located relative to available technicians.

### Tip 2: Use ESC Liberally
**ESC** is your friend! It instantly closes any overlay and returns you to the clean map view.

### Tip 3: Multiple Overlays?
Only **one overlay** can be open at a time. Opening a new overlay automatically closes the previous one.

### Tip 4: Lost? Go Home
If you navigate to a full page (Technicians, Admin) and want to return to the map, click the **Search icon** (🔍) in the sidebar.

### Tip 5: Mobile Users
On mobile, overlays adapt to smaller screens. Swipe down to close overlays on touch devices.

---

## 🤔 FAQ

**Q: Why doesn't the Jobs List navigate to a new page?**
A: Overlays keep the map visible so you maintain geographic context while browsing jobs.

**Q: Can I have multiple overlays open at once?**
A: No, only one overlay at a time. This keeps the interface clean and focused.

**Q: Why are Technicians and Admin full pages?**
A: These features benefit from full-screen space for detailed views. They may become overlays in future versions.

**Q: What if I want to see the full map without overlays?**
A: Press **ESC** to close all overlays, or click the **Search icon** (🔍) in the sidebar.

**Q: Do overlays work on mobile?**
A: Yes! Overlays adapt to mobile screens. Tap the X button or swipe down to close.

**Q: Can I bookmark a specific overlay?**
A: No, overlays are state-based (not URL-based). Bookmark pages like `/technicians` or `/admin` instead.

---

## 🆘 Need Help?

If you get stuck:
1. Press **ESC** to reset to map view
2. Click **Search icon** (🔍) to return home
3. Use browser refresh if something seems broken
4. Contact support at hello@ravensearch.app

---

**Built with ❤️ using overlay-first architecture for a seamless experience!**

*Last Updated: November 1, 2025*

