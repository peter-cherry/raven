> Archived on 2026-01-12 from TESTING_GUIDE.md. Reason: Review needed - may contain active testing procedures

# Legal Framework Testing Guide

**Date:** November 19, 2025
**Status:** Ready for Testing
**Development Server:** http://localhost:3000

---

## Prerequisites

### 1. Database Migration (REQUIRED FIRST)

Since Docker/Supabase CLI isn't running, you need to run the migration manually through the Supabase dashboard:

**Steps:**
1. Go to https://supabase.com/dashboard
2. Select your project: `utpmtlzqpyewpwzgsbdu`
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the contents of `/supabase/migrations/20251119_compliance_legal_framework.sql`
6. Paste into the SQL editor
7. Click **Run** (or press Cmd+Enter)
8. Verify success message

**Expected Result:**
```
Successfully created:
- compliance_policies table
- compliance_acknowledgments table
- Added 3 columns to organizations table
- 5 RLS policies
- 2 helper functions
```

**Verification Query:**
```sql
-- Check tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('compliance_policies', 'compliance_acknowledgments');

-- Check organization columns were added
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'organizations'
AND column_name IN ('compliance_policy_acknowledged', 'onboarding_complete', 'onboarding_completed_at');
```

### 2. Development Server

The development server is already running at http://localhost:3000.

To restart if needed:
```bash
npm run dev
```

---

## Testing Checklist

### Part 1: Terms of Service Page

**URL:** http://localhost:3000/legal/terms

**Test Steps:**

1. **Page Load**
   - [ ] Page loads without errors
   - [ ] Styling uses glassmorphic design (backdrop blur)
   - [ ] All CSS variables are applied correctly

2. **Table of Contents**
   - [ ] TOC displays all 9 sections
   - [ ] Clicking section links scrolls to correct section
   - [ ] Smooth scroll behavior works

3. **Section Expansion/Collapse**
   - [ ] Section 1 (Platform Definition) is fully visible by default
   - [ ] Section 2 (Client Responsibilities) is fully visible by default
   - [ ] Red warning boxes in Section 2 are displayed
   - [ ] Sections 3-9 are collapsed by default
   - [ ] Clicking section header toggles expansion
   - [ ] Chevron icon rotates on toggle

4. **Navigation**
   - [ ] "Back to Home" link in header works
   - [ ] "Back to Home" link in footer works
   - [ ] Links navigate to `/` (homepage)

5. **Mobile Responsive**
   - [ ] Page is responsive on mobile viewport (< 768px)
   - [ ] Text is readable at small sizes
   - [ ] Sections expand/collapse on mobile

---

### Part 2: Compliance Policy Configuration

**URL:** http://localhost:3000/onboarding/compliance/configure

**Prerequisites:**
- You must be signed in to the app
- User must have an organization in `org_memberships` table

**Test Steps:**

1. **Page Load**
   - [ ] Page loads without errors
   - [ ] Header displays "Set Your Compliance Requirements"
   - [ ] Description text is visible
   - [ ] All requirement groups are displayed

2. **Trade Licenses Section**
   - [ ] HVAC License checkbox is checked by default
   - [ ] Plumbing License checkbox is checked by default
   - [ ] Electrical License checkbox is checked by default
   - [ ] General Contractor checkbox is unchecked by default
   - [ ] Enforcement dropdown appears when requirement is checked
   - [ ] Enforcement dropdown disappears when requirement is unchecked

3. **Certifications Section**
   - [ ] EPA 608 checkbox is checked by default
   - [ ] OSHA 10 checkbox is unchecked by default
   - [ ] OSHA 30 checkbox is unchecked by default
   - [ ] Enforcement levels can be changed (Required/Recommended/Optional)

4. **Insurance & Background Section**
   - [ ] General Liability checkbox is checked (shows "$2M minimum")
   - [ ] Workers Compensation checkbox is checked
   - [ ] Background Check checkbox is checked
   - [ ] Drug Testing checkbox is unchecked

5. **Info Box**
   - [ ] Info box explains enforcement levels
   - [ ] Three enforcement levels described correctly

6. **Save Functionality**
   - [ ] "Continue →" button is enabled
   - [ ] Button shows "Saving..." when clicked
   - [ ] Policy is saved to `compliance_policies` table
   - [ ] User is redirected to `/onboarding/compliance/acknowledge`

**Database Verification (after saving):**
```sql
SELECT * FROM public.compliance_policies
WHERE org_id = 'YOUR_ORG_ID'
ORDER BY created_at DESC
LIMIT 1;
```

Expected:
- `requirements` field contains JSONB array of enabled requirements
- `version` is '1.0'
- `created_at` is current timestamp

---

### Part 3: Liability Acknowledgment

**URL:** http://localhost:3000/onboarding/compliance/acknowledge
(Should redirect here automatically after completing Part 2)

**Test Steps:**

1. **Modal Display**
   - [ ] Warning triangle icon (yellow) displays at top
   - [ ] Title: "Compliance Agreement" is centered
   - [ ] Modal max-width is 540px
   - [ ] Glassmorphic styling applied (no background tint)

2. **Scrollable Content**
   - [ ] Content box has max-height of 200px
   - [ ] Content is scrollable
   - [ ] Summary bullets are visible:
     - Determining credential requirements
     - Verifying contractor credentials
     - Ensuring regulatory compliance
     - Making final contractor selection
   - [ ] Platform tools section displays
   - [ ] Red warning text: "We do NOT verify credentials" is visible

3. **Full Terms Toggle**
   - [ ] "Read full terms" link is visible
   - [ ] Clicking toggles expanded text
   - [ ] Link text changes to "Hide full terms" when expanded
   - [ ] Full agreement text displays when expanded

4. **External ToS Link**
   - [ ] "view Terms of Service" link is present
   - [ ] Link opens ToS in new tab
   - [ ] Link goes to `/legal/terms`

5. **Checkboxes**
   - [ ] All 3 checkboxes are unchecked by default
   - [ ] First checkbox: "I understand my compliance responsibilities"
   - [ ] Second checkbox: "I will independently verify all contractor credentials"
   - [ ] Third checkbox: "I accept full liability for contractor selection decisions"
   - [ ] Checking boxes updates state correctly

6. **Name Field**
   - [ ] Name field is pre-filled if user has `full_name` in metadata
   - [ ] If no name, field is empty (or shows email prefix)
   - [ ] User can edit name
   - [ ] Field accepts text input

7. **Date Display**
   - [ ] Auto-filled date is displayed below name field
   - [ ] Date format: "Month DD, YYYY" (e.g., "November 19, 2025")

8. **Submit Button State**
   - [ ] "I Agree & Continue" button is DISABLED initially
   - [ ] Button becomes ENABLED when:
     - All 3 checkboxes are checked
     - Name field has text (length > 0)
   - [ ] Button shows "Submitting..." when clicked
   - [ ] Button is disabled during submission

9. **Submission & Redirect**
   - [ ] On submit, record is created in `compliance_acknowledgments` table
   - [ ] Organization flags are updated:
     - `compliance_policy_acknowledged` = true
     - `onboarding_complete` = true
     - `onboarding_completed_at` = current timestamp
   - [ ] User is redirected to homepage (`/`)

10. **Cancel Button**
    - [ ] "Cancel" button is visible
    - [ ] Clicking navigates back to previous page

**Database Verification (after submission):**

```sql
-- Check acknowledgment record
SELECT
  user_name,
  user_email,
  ip_address,
  user_agent,
  acknowledged_at,
  policy_version,
  agreement_version,
  LENGTH(full_agreement_text) as agreement_length
FROM public.compliance_acknowledgments
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY acknowledged_at DESC
LIMIT 1;
```

Expected:
- `user_name` matches submitted name
- `user_email` matches current user email
- `ip_address` is valid IP (from api.ipify.org)
- `user_agent` matches browser user agent
- `acknowledged_at` is current timestamp
- `policy_version` is '1.0'
- `agreement_version` is '1.0'
- `agreement_length` is > 1000 characters

```sql
-- Check organization flags
SELECT
  id,
  name,
  compliance_policy_acknowledged,
  onboarding_complete,
  onboarding_completed_at
FROM public.organizations
WHERE id = 'YOUR_ORG_ID';
```

Expected:
- `compliance_policy_acknowledged` = true
- `onboarding_complete` = true
- `onboarding_completed_at` = current timestamp

---

## Error Testing

### Test Error Scenarios

1. **No Organization**
   - Sign in as user with no `org_memberships` entry
   - Navigate to `/onboarding/compliance/configure`
   - Expected: "Continue →" button is disabled (orgId is null)

2. **API Failure**
   - Disconnect from internet temporarily
   - Try to submit acknowledgment
   - Expected: Alert "Failed to save acknowledgment. Please try again."

3. **Duplicate Submission**
   - Complete flow once
   - Try to submit acknowledgment again
   - Expected: Should allow re-acknowledgment (creates new record)

4. **IP Address Fetch Failure**
   - Block api.ipify.org in browser DevTools (Network tab)
   - Try to submit acknowledgment
   - Expected: Graceful handling (may need to add fallback)

---

## Mobile Testing

Test all pages on mobile viewport (< 768px):

1. **ToS Page**
   - [ ] Sections expand/collapse work on touch
   - [ ] Text is readable without horizontal scroll
   - [ ] Navigation links are tappable (44px+ touch targets)

2. **Configure Page**
   - [ ] Checkboxes are tappable
   - [ ] Dropdowns work on mobile
   - [ ] Layout stacks vertically
   - [ ] "Continue →" button is full-width on mobile

3. **Acknowledge Page**
   - [ ] Modal fits within viewport (no overflow)
   - [ ] Scrollable content works with touch
   - [ ] Checkboxes are tappable
   - [ ] Name input doesn't trigger iOS zoom (font-size ≥ 16px)
   - [ ] Submit button is full-width on mobile

---

## Performance Testing

1. **Load Times**
   - [ ] ToS page loads in < 1 second
   - [ ] Configure page loads in < 1 second
   - [ ] Acknowledge page loads in < 1 second

2. **Database Queries**
   - [ ] Policy save completes in < 500ms
   - [ ] Acknowledgment save completes in < 1 second
   - [ ] No N+1 queries

3. **Network Requests**
   - [ ] IP address fetch from api.ipify.org completes in < 500ms
   - [ ] Only necessary API calls are made
   - [ ] No redundant Supabase queries

---

## Accessibility Testing

1. **Keyboard Navigation**
   - [ ] All interactive elements are keyboard-accessible (Tab/Shift+Tab)
   - [ ] Checkboxes can be toggled with Space
   - [ ] Buttons can be activated with Enter
   - [ ] Form can be submitted with Enter key

2. **Screen Reader**
   - [ ] Section headings are properly labeled
   - [ ] Form fields have associated labels
   - [ ] Buttons have descriptive text
   - [ ] Links have meaningful text (not just "click here")

3. **Focus States**
   - [ ] Focused elements have visible outline
   - [ ] Focus order is logical
   - [ ] No focus traps

---

## Browser Compatibility

Test in the following browsers:

- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Known Issues / Limitations

1. **Docker Dependency**: Database migration requires manual execution via Supabase dashboard (Docker/Supabase CLI not running)

2. **IP Address**: Uses external service (api.ipify.org) for IP detection - may fail if service is down

3. **Email Pre-fill**: Depends on user metadata having `full_name` field - may not always be available

4. **Redirect After Acknowledgment**: Hardcoded to `/` (homepage) - may need to be configurable based on context

---

## Next Steps After Testing

Once testing is complete and all issues are resolved:

1. **Integration**
   - [ ] Add link from signup/onboarding flow to `/onboarding/compliance/configure`
   - [ ] Add "Review Compliance Policy" link in settings/admin panel
   - [ ] Check `compliance_policy_acknowledged` before first work order creation

2. **Legal Review**
   - [ ] Have attorney review ToS text
   - [ ] Confirm compliance with state/federal laws
   - [ ] Get product team sign-off

3. **Production Deployment**
   - [ ] Run migration on production database
   - [ ] Test in staging environment
   - [ ] Deploy to production
   - [ ] Monitor for errors in Sentry

---

## Support

**Questions or Issues?**

- Check browser console for JavaScript errors
- Check Network tab for failed API requests
- Verify Supabase connection in DevTools
- Check database logs in Supabase dashboard
- Review `/LEGAL_FRAMEWORK_IMPLEMENTATION.md` for additional context

**Common Fixes:**

- **Page not loading?** Check Next.js dev server is running (`npm run dev`)
- **Database errors?** Verify migration was run successfully
- **Redirect not working?** Check browser console for navigation errors
- **Styling broken?** Verify `global.css` is imported in `layout.tsx`

---

**Built with ❤️ by Claude Code**
**Last Updated:** November 19, 2025

