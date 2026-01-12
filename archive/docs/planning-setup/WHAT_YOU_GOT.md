> Archived on 2026-01-12 from WHAT_YOU_GOT.md. Reason: Historical visual documentation guide

# What You Got - Visual Guide

## 🎯 The 3 Systems Explained Simply

---

## 1. SLA Timers System ⏱️

### What it does:
Tracks how long each stage of a job takes and alerts you if things are taking too long.

### The 4 Stages:
1. **Dispatch** - Time to send job to technicians
2. **Assignment** - Time for a tech to accept the job
3. **Arrival** - Time for tech to arrive on-site
4. **Completion** - Time to finish the job

### What you see:

**On Job Creation Page:**
```
┌─────────────────────────────────────┐
│ Create New Job                      │
├─────────────────────────────────────┤
│ Trade: [HVAC ▼]                     │
│ Urgency: [Emergency ▼]              │
│                                      │
│ ⏱️ SLA Timer Settings                │
│ ┌─────────────────────────────────┐ │
│ │ Dispatch Timer:    [15] minutes │ │
│ │ Assignment Timer:  [30] minutes │ │
│ │ Arrival Timer:     [60] minutes │ │
│ │ Completion Timer: [240] minutes │ │
│ │                                  │ │
│ │ Total Time: 5 hours 45 minutes  │ │
│ │ [Reset to Defaults]             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**On Jobs List Page:**
```
┌──────────────────────────────────────────┐
│ Job #1234 - HVAC Emergency               │
│ Los Angeles, CA                          │
│                                          │
│ Status: Dispatched                       │
│ SLA: [🟢 On Time - 42 min remaining]    │  ← Click to see details!
└──────────────────────────────────────────┘
```

**When you click the badge:**
```
┌─────────────────────────────────────────────┐
│           SLA Timer Details                 │
├─────────────────────────────────────────────┤
│ ✅ Dispatch       [████████████] Completed  │
│    Started: 2:30 PM                         │
│    Completed: 2:42 PM (12 min)              │
│                                             │
│ 🟢 Assignment     [████████░░░░] On Track  │
│    Started: 2:42 PM                         │
│    Target: 3:12 PM (18 min remaining)       │
│                                             │
│ ⏸️  Arrival        [░░░░░░░░░░░░] Pending   │
│    Not started yet                          │
│                                             │
│ ⏸️  Completion     [░░░░░░░░░░░░] Pending   │
│    Not started yet                          │
│                                             │
│ ⚠️ Alerts                                   │
│ └─ No alerts yet                            │
└─────────────────────────────────────────────┘
```

**Badge Colors:**
- 🟢 **Green "On Time"** = Everything is good, plenty of time left
- ⚠️ **Amber "Warning"** = Running low on time (25% remaining)
- 🔴 **Red "Breached"** = Time ran out, SLA violated
- ✅ **Purple "Done"** = Stage completed successfully

---

## 2. Dispatch System 📧

### What it does:
Sends job offers to multiple technicians via email and tracks who opens, reads, and responds.

### The Flow:

**Step 1 - Search Results:**
```
┌──────────────────────────────────────────────┐
│ Search Results: 15 technicians found         │
│                                              │
│ [📧 Dispatch to All 15 Technicians]         │  ← Click here!
│                                              │
│ ┌──────────────────────────────────────┐    │
│ │ 👨‍🔧 John's HVAC                       │    │
│ │ Match Score: 9/10                    │    │
│ │ Distance: 3.2 miles                  │    │
│ └──────────────────────────────────────┘    │
│ ┌──────────────────────────────────────┐    │
│ │ 👨‍🔧 ABC Cooling                      │    │
│ │ Match Score: 8/10                    │    │
│ │ Distance: 5.1 miles                  │    │
│ └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

**Step 2 - Real-time Progress:**
```
┌────────────────────────────────────────────┐
│ 📧 Dispatching to 15 technicians...        │
├────────────────────────────────────────────┤
│                                            │
│ 📤 Reaching: 15 technicians                │
│ ✅ Sent: 15 emails                         │
│ 👁️  Opened: 7 so far                       │  ← Updates live!
│ 💬 Replied: 2                              │
│ ✅ Qualified: 1 ready to work              │
│                                            │
│ [████████████░░░░░░] 67% Complete          │
│                                            │
└────────────────────────────────────────────┘
```

**Step 3 - Click Technician Name:**
```
┌─────────────────────────────────────────────┐
│  [👤 Profile] [💬 AI Conversation]  ← Tabs! │
├─────────────────────────────────────────────┤
│                                             │
│ Conversation Status: [✅ Qualified]         │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ AI Assistant                   2:45 PM│   │
│ │ "Hi! We have an HVAC emergency job   │    │
│ │  in LA. Are you available today?"    │    │
│ └─────────────────────────────────────┘    │
│                                             │
│         ┌─────────────────────────────┐    │
│         │ Yes, I can be there in 30min│    │
│         │ John (Technician)      3:12PM│    │
│         └─────────────────────────────┘    │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ AI Assistant                   3:13 PM│   │
│ │ "Great! Do you have EPA certification│    │
│ │  for emergency HVAC work?"           │    │
│ │               [✅ Qualified by AI]   │    │
│ └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### What happens behind the scenes:
1. Email sent to tech via Instantly.ai
2. Email includes invisible 1x1 tracking pixel
3. When tech opens email → pixel loads → "Opened" count updates
4. When tech replies → AI bot analyzes response
5. AI decides if tech is qualified for the job
6. You see the conversation in real-time

---

## 3. Admin Outreach System 🎯

### What it does:
Helps you find and recruit new technicians through cold email campaigns.

### The Admin Dashboard:

**Outreach Page:**
```
┌───────────────────────────────────────────────────────┐
│  Cold Outreach          [📊 View Activity] [⚙️ Settings]│
├───────────────────────────────────────────────────────┤
│  [📧 Campaigns] [👥 Targets (247)]                    │
│                                                       │
│  [+ New Campaign]                                     │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Q1 2025 HVAC Recruitment          [🟢 ACTIVE]   │ │
│  │ Trade: HVAC                                      │ │
│  │                                                  │ │
│  │ Total: 150    Sent: 150    Opened: 67    Replies: 12│
│  │ [████████████████░░░░░░░░] 45% open rate        │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Plumbers Expansion                [⏸️ PAUSED]    │ │
│  │ Trade: Plumbing                                  │ │
│  │                                                  │ │
│  │ Total: 97     Sent: 45     Opened: 18    Replies: 3│
│  └─────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

**Targets Tab - Collecting Technicians:**
```
┌───────────────────────────────────────────┐
│  [📧 Campaigns] [👥 Targets (247)]        │
│                                           │
│  [🔍 Collect Technicians]                 │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │ Name           Email        Status   │ │
│  ├─────────────────────────────────────┤ │
│  │ John Smith    john@hvac... ✅ Ready  │ │
│  │ ABC HVAC      abc@abc....  🔄 Enriching│
│  │ Cool Air Pro  cool@air...  ⏳ Pending│ │
│  │ Jane Doe      jane@fix...  ✅ Ready  │ │
│  └─────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

**When you click "Collect Technicians":**
```
┌────────────────────────────────────┐
│  Collect Technicians               │
├────────────────────────────────────┤
│  Source: [Google Places ▼]        │
│  Trade: [HVAC ▼]                   │
│  State: [CA]                       │
│  Query: hvac repair los angeles    │
│                                    │
│  [Cancel] [Start Collection]       │
└────────────────────────────────────┘
```

**Activity Dashboard:**
```
┌──────────────────────────────────────────────┐
│  Activity Dashboard       [📧 Outreach] [⚙️]  │
├──────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Total    │ │ Pending  │ │ Enriched │    │
│  │  247     │ │   45     │ │   202    │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                              │
│  Recent Scraping Activity                    │
│  ┌──────────────────────────────────────┐  │
│  │ Source  Trade  State  Results  New   │  │
│  ├──────────────────────────────────────┤  │
│  │ Google  HVAC   CA     15       12    │  │
│  │ Yelp    Plumb  NY     23       18    │  │
│  │ Google  Elec   TX     8        5     │  │
│  └──────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### The Complete Flow:

1. **Collect** - Scrape Google/Yelp for technician emails
2. **Enrich** - Verify emails via Hunter.io, add missing info
3. **Campaign** - Create campaigns in Instantly.ai
4. **Send** - Bulk send recruitment emails
5. **Track** - Monitor opens, replies, conversions
6. **Analyze** - See which sources/trades convert best

---

## 🎨 Color Guide

**Status Indicators Throughout the App:**

- 🟢 **Green** - Success, on-time, completed, qualified
- 🟡 **Amber** - Warning, in-progress, pending review
- 🔴 **Red** - Error, breached, failed, disqualified
- 🔵 **Purple** - Active, in-progress, primary action
- ⚪ **Gray** - Inactive, draft, not started

---

## 📊 What Updates in Real-Time

### ✅ Real-time (No Refresh Needed):
- SLA timer countdown in modal
- Dispatch loader stats (sent/opened/qualified)
- AI conversation messages
- Admin activity log
- Campaign statistics

### 🔄 Manual Refresh:
- SLA badges on jobs list (shows on page load/refresh)
- Job status changes
- Target enrichment status

---

## 🔐 Who Can See What

**Regular Users:**
- ✅ Create jobs with SLA settings
- ✅ View SLA timers on their jobs
- ✅ Dispatch jobs to technicians
- ✅ View AI conversations
- ❌ Cannot access /admin routes

**Admin Users:**
- ✅ Everything regular users can do
- ✅ Access /admin/outreach
- ✅ Access /admin/activity
- ✅ Access /admin/settings
- ✅ Create campaigns
- ✅ Collect technicians
- ✅ View all activity

---

## 🚀 Quick Use Cases

**Scenario 1: Emergency Job**
1. Create job, select "Emergency" urgency
2. SLA auto-sets to 15/30/60/240 minutes
3. Click "Dispatch to All"
4. Watch real-time as techs open emails
5. First qualified tech wins the job
6. Monitor SLA to ensure completion on time

**Scenario 2: Growing Tech Network**
1. Go to /admin/outreach
2. Click "Collect Technicians"
3. Scrape Google for "HVAC repair Los Angeles"
4. System finds 15 techs, enriches their emails
5. Create campaign in Instantly
6. Send recruitment emails
7. Monitor replies in AI conversations
8. Qualified techs join your network

**Scenario 3: Performance Tracking**
1. Check /jobs list
2. See SLA badges showing performance
3. 🟢 = Jobs completed on time
4. 🔴 = Jobs that breached SLA
5. Click any badge for detailed breakdown
6. Identify bottlenecks (e.g., slow assignment)
7. Adjust SLA settings for future jobs

---

## 📱 Mobile Responsive

All components work on:
- 📱 iPhone/Android
- 💻 Desktop
- 📱 Tablet

The design adapts to screen size automatically.

---

## 🎯 Summary

**You now have:**
1. ⏱️ Complete SLA tracking with 4-stage timers
2. 📧 Automated dispatch with real-time tracking
3. 🤖 AI-powered qualification bot
4. 🎯 Cold outreach campaign system
5. 📊 Real-time dashboards
6. 🔐 Admin access control

**All integrated into your existing Ravensearch app with:**
- Matching design system (purple theme)
- Real-time Supabase updates
- Mobile-responsive UI
- Row-level security
- Edge Functions for backend logic

---

Ready to start? Open **STEP_BY_STEP_GUIDE.md** for setup instructions!

