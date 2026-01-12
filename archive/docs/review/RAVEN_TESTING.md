> Archived on 2026-01-12 from RAVEN_TESTING.md. Reason: Review needed - may contain active testing info

# Raven Testing Checklist

## Summary
Testing document for Raven facility management application. Each issue is categorized by location, platform, and completion status.

---

## 🔴 NOT COMPLETED

### Homepage > Quick Compliance
- **Problem:** Not able to click on 'COI Required' except if clicked exactly on the small box
- **Platforms:** Mobile ✓ | Web ✓
- **Solution:** Expand clickable area for 'COI Required' checkbox
- **Status:** ❌ Not completed

### Homepage
- **Problem:** Change icon to home according to global CSS
- **Platforms:** Web ✓
- **Solution:** Update icon to match global CSS home icon
- **Status:** ❌ Not completed

### Create an Account - Email Auth
- **Problem:** 
  - Pop-ups from Apple/Bitwarden refresh page and redirect to homepage
  - Sign up takes user to homepage not logged in
  - Confirmation email from 'Supabase Auth' with no mention of Raven
  - No messaging about checking email for confirmation
  - After confirming email, still can't sign in ('email not confirmed' error)
- **Platforms:** Mobile ✓ | Web ✓
- **Solution:** Sign up through email needs authentication and configuration in SendGrid
- **Status:** ❌ Not completed

### Create an Account - Google Auth
- **Problem:** Google sign-in shows "Sign in to utpmtlzqpyewpwzgsbdu.supabase.co"
- **Platforms:** Mobile ✓ | Web ✓
- **Solution:** Update Google authentication to state "Sign in to Ravensearch"
- **Status:** ❌ Not completed

### Time Display
- **Problem:** Time is not updating every minute, only with refresh or clicking in the window
- **Platforms:** Mobile ✓ | Web ✓
- **Solution:** Implement auto-refresh interval for time display
- **Status:** ❌ Not completed

### Profile Icon
- **Problem:** Shows "P" instead of user's first name initial; positioned incorrectly
- **Platforms:** Web ✓
- **Solution:** Display user's first name initial with circle around it, move to top position
- **Status:** ❌ Not completed (there is a T at the top, not bottom left - move whole thing to top)

### Sign Out
- **Problem:** Arrow doesn't do anything, signs out automatically without warning
- **Platforms:** Mobile ✓ | Web ✓
- **Solution:** Remove arrow, show confirmation pop-up "Are you sure you want to sign out?"
- **Status:** ❌ Not completed (plus sign out is not at top anymore)

### Work Order - Loader
- **Problem:** Loader animation not visible
- **Platforms:** Mobile ✓ | Web ✓
- **Solution:** Make the loader animation more prominent
- **Status:** ❌ Not completed

### Work Order - Contact Auto-fill
- **Problem:** Contact name and email not automatically filled in after first work order
- **Platforms:** Mobile ✓ | Web ✓
- **Solution:** Check authentication and fix auto-fill logic
- **Status:** ❌ Not completed (either shows 'Not Provided' or 'John Doe')

---

## 🟡 PARTIALLY COMPLETED

### Homepage > Quick Compliance (Partial)
- **Problem:** Button should say 'Done'; show quick start template in overlay
- **Platforms:** Mobile ✓ | Web ✓
- **Solution:** 
  - Button text changed ✅
  - Fix what buttons do + redirect to login if not signed in ⚠️
- **Status:** 🟡 Partial

### Compliance
- **Problem:** Can't click on 'Standard', 'High-Risk', 'Basic' Coverage
- **Platforms:** Mobile ✓ | Web ✓
- **Solution:** Enable quick templates in compliance overlay
- **Status:** 🟡 OK but fix what the buttons do

### Work Order - Calendar Widget (Mobile)
- **Problem:** Calendar widget not showing properly on mobile
- **Platforms:** Mobile ✓
- **Solution:** Fix calendar to show proper month layout (not 1 column list)
- **Status:** 🟡 Yes, but circle is not centered on selected date

### Draft
- **Problem:** Draft coming empty, not loading previous work orders
- **Platforms:** Mobile ✓ | Web ✓
- **Solution:** Create overlay showing drafts with title and first sentence
- **Status:** 🟡 Worked only once; something blocking draft overlay; should have separate page

### Jobs Overview > Job Details
- **Problem:** Can't see all details of jobs after creating work order
- **Platforms:** Mobile ✓ | Web ✓
- **Solution:** Show "details" icon next to delete button with overlay
- **Status:** 🟡 Does not show everything

---

## 🟢 COMPLETED

### Jobs Overview + Compliance Navigation
- **Problem:** Going back to Homepage (clicking x) is confusing on web
- **Platforms:** Web ✓
- **Solution:** No action needed (more clear on mobile)
- **Status:** ✅ No action needed

### Work Order - Dimensions & Animation
- **Problem:** Overlay dimensions inconsistent
- **Solution:** Match dimensions to workorderdetail overlay and dispatchLoader
- **Status:** ✅ Completed

### Work Order - Chevrons
- **Problem:** Chevron colors inconsistent
- **Solution:** Make all chevrons white as stroke colors
- **Status:** ✅ Completed

### Work Order - SLA Tooltips
- **Problem:** SLA tooltips gone
- **Solution:** Re-enable SLA tooltips and make box bigger
- **Status:** ✅ Completed

### Work Order - AM/PM
- **Problem:** Scheduled start missing AM/PM on desktop
- **Solution:** Add AM/PM options
- **Status:** ✅ Completed

### Work Order - Voltage Field
- **Problem:** Unnecessary voltage field for electric jobs
- **Solution:** Remove voltage from electric work orders
- **Status:** ✅ Completed

### Work Order - System Type
- **Problem:** Unnecessary system type for HVAC
- **Solution:** Remove system type from HVAC work orders
- **Status:** ✅ Completed

### Work Order - Emergency Toggle
- **Problem:** No emergency toggle
- **Solution:** Add emergency toggle in upper right corner
- **Status:** ✅ Completed (but make smaller)

### Work Order - Section Navigation
- **Problem:** Job details/schedule/contact info not clickable
- **Solution:** Make clickable with auto-scroll
- **Status:** ✅ Completed

### Work Order - Unauthorized Error
- **Problem:** Shows "Unauthorized" when not signed in
- **Solution:** Redirect to sign in page instead
- **Status:** ✅ Completed

### Create an Account - Terms
- **Problem:** Can't see Terms and Conditions
- **Platforms:** Mobile ✓ | Web ✓
- **Solution:** Make Terms and Conditions linkable to ToS page
- **Status:** ✅ Completed

### Onboarding Compliance Configure
- **Problem:** Tick box colors incorrect
- **Platforms:** Mobile ✓ | Web ✓
- **Solution:** Adjust tick box colors to white strokes, no fill
- **Status:** ✅ Completed

### Settings
- **Problem:** Settings should open admin pages
- **Platforms:** Mobile ✓ | Web ✓
- **Solution:** Remove settings from upper right corner, leave in profile icon
- **Status:** ✅ Completed

### Admin Page Visibility
- **Problem:** Admin page visible to everyone
- **Platforms:** Mobile ✓ | Web ✓
- **Solution:** Only visible to superadmins
- **Status:** ✅ Completed

---

## 🔵 NOT TESTED / NO STATUS

### Homepage (Not Signed In)
- **Problem:** 
  - Can't click on 'sign up' or 'login' at top right
  - Profile icon on bottom left shows sign out option (shouldn't be there when not signed in)
- **Platforms:** Not specified
- **Solution:** TBD
- **Status:** ⬜ Needs testing

### Contractors Onboarding Page
- **URL:** https://www.raven-search.com/contractors/onboarding
- **Problem:**
  - Phone number and email accepted in wrong format
  - Email error displayed under password field instead of email
  - Step 6: Can't see Terms of Service and Privacy Policy
- **Platforms:** Not specified
- **Solution:**
  - Apply verification for phone number and email
  - Write error messages under correct fields
  - Make Terms of Service and Privacy Policy clickable in step 6
- **Status:** ⬜ Needs testing

---

## Quick Stats

| Status | Count |
|--------|-------|
| ❌ Not Completed | 9 |
| 🟡 Partial | 5 |
| ✅ Completed | 14 |
| ⬜ Not Tested | 2 |
| **Total** | **30** |

