> Archived on 2026-01-12 from AUTHENTICATION_401_FIX.md. Reason: Historical bug fix documentation

# 401 Unauthorized Error Fix - Job Creation

**Error:** `Failed to load resource: the server responded with a status of 401`
**Endpoint:** `utpmtlzqpyewpwzgsbdu.supabase.co/rest/v1/jobs?select=*`
**Root Cause:** Multiple Supabase client instances + authentication token not attached to request

---

## Problem Analysis

### Error Details

From console logs:
```
[Got org ID] 550e8400-e29b-41d4-a716-446655440000
Multiple GoTrueClient instances detected in the same browser context
utpmtlzqpyewpwzgsbdu.supabase.co/rest/v1/jobs?select=*:1 Failed to load resource: 401 ()
```

### Root Causes

1. **Multiple Supabase Client Instances**
   - Warning: "Multiple GoTrueClient instances detected"
   - Each component creates its own client instance
   - Auth session not properly shared between instances

2. **Client-Side Insert with RLS**
   - Client uses `createClientComponentClient()` from `@supabase/auth-helpers-nextjs`
   - RLS policy requires authenticated user
   - Auth token not being sent with insert request

3. **Singleton Pattern Breaking**
   - `lib/supabaseClient.ts` uses Proxy pattern
   - Still allows multiple instances via lazy initialization
   - Each render may create new client

---

## Solution: Fix Supabase Client Singleton

### Current Implementation (BROKEN)

```typescript
// File: lib/supabaseClient.ts
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient();
  }
  return supabaseInstance!;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
```

**Problem:** Each component import may trigger new initialization due to module bundling

### Fixed Implementation

```typescript
// File: lib/supabaseClient.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Create SINGLE instance immediately (not lazy)
export const supabase = createClientComponentClient<Database>();

// Prevent re-instantiation
if (typeof window !== 'undefined') {
  if ((window as any).__supabase) {
    console.warn('Supabase client already exists, reusing instance');
  } else {
    (window as any).__supabase = supabase;
  }
}
```

**Why this works:**
- ✅ Creates client ONCE at module load
- ✅ No Proxy complexity
- ✅ Auth session properly maintained
- ✅ Window check prevents server-side issues

---

## Alternative Solution: Use API Route for Job Creation

Instead of client-side insert, use server-side API route.

### Create API Route

```typescript
// File: app/api/jobs/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobData = await request.json();

    // Insert job with authenticated context
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        org_id: jobData.org_id,
        job_title: jobData.job_title,
        description: jobData.description,
        trade_needed: jobData.trade_needed,
        required_certifications: jobData.required_certifications ?? [],
        address_text: jobData.address_text,
        city: jobData.city,
        state: jobData.state,
        lat: jobData.lat,
        lng: jobData.lng,
        scheduled_at: jobData.scheduled_at,
        duration: jobData.duration,
        urgency: jobData.urgency,
        budget_min: jobData.budget_min,
        budget_max: jobData.budget_max,
        pay_rate: jobData.pay_rate,
        contact_name: jobData.contact_name,
        contact_phone: jobData.contact_phone,
        contact_email: jobData.contact_email,
        job_status: 'matching',
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('[Job Creation] Database error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ job }, { status: 200 });

  } catch (error: any) {
    console.error('[Job Creation] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Update CreateJobForm to Use API

```typescript
// File: components/CreateJobForm.tsx
const createJob = async (jobData: { parsed: any; geo: any; orgId: string }) => {
  const { parsed, geo, orgId } = jobData;

  // Use API route instead of direct Supabase insert
  const response = await fetch('/api/jobs/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      org_id: orgId,
      job_title: parsed.data.job_title,
      description: parsed.data.description,
      trade_needed: parsed.data.trade_needed,
      required_certifications: parsed.data.required_certifications ?? [],
      address_text: parsed.data.address_text,
      city: geo.city,
      state: geo.state,
      lat: geo.lat,
      lng: geo.lng,
      scheduled_at: parsed.data.scheduled_start_ts,
      duration: parsed.data.duration,
      urgency: parsed.data.urgency,
      budget_min: parsed.data.budget_min,
      budget_max: parsed.data.budget_max,
      pay_rate: parsed.data.pay_rate,
      contact_name: parsed.data.contact_name,
      contact_phone: parsed.data.contact_phone,
      contact_email: parsed.data.contact_email
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    setErrors({ form: errorData.error || 'Failed to create job' });
    setSubmitting(false);
    return null;
  }

  const { job } = await response.json();

  // Continue with SLA timers and matching...
  const policyId = params?.get('policy_id');
  if (policyId) {
    try {
      await supabase.from('compliance_policies').update({ job_id: job.id }).eq('id', policyId);
    } catch {}
  }

  // Initialize SLA timers
  try {
    await supabase.rpc('initialize_sla_timers', {
      p_job_id: job.id,
      p_dispatch_minutes: slaConfig.dispatch,
      p_assignment_minutes: slaConfig.assignment,
      p_arrival_minutes: slaConfig.arrival,
      p_completion_minutes: slaConfig.completion
    });
  } catch (err) {
    console.error('Failed to initialize SLA timers:', err);
  }

  await supabase.rpc('find_matching_technicians', {
    p_job_id: job.id,
    p_lat: geo.lat,
    p_lng: geo.lng,
    p_trade: parsed.data.trade_needed,
    p_state: geo.state,
    p_max_distance_m: 10000
  });

  return job;
};
```

**Why API route is better:**
- ✅ Server-side auth always works
- ✅ No client-side RLS complexity
- ✅ Proper error handling
- ✅ Can add server-side validation
- ✅ No multiple client instance issues

---

## Recommended Fix: Hybrid Approach

**Step 1:** Fix Supabase client singleton (prevents future issues)
**Step 2:** Use API route for job creation (guarantees auth works)

This gives you:
- ✅ Reliable authentication
- ✅ No 401 errors
- ✅ Better security (server-side validation)
- ✅ Cleaner architecture

---

## Quick Fix (Test Now)

To test if auth is the issue, check the user's session:

```typescript
// Add this to CreateJobForm before createJob
const { data: { session } } = await supabase.auth.getSession();
console.log('[Auth Session]', session);

if (!session) {
  console.error('[Auth] No session found!');
  setErrors({ form: 'Please log in again' });
  return;
}
```

If session is null → user needs to re-login
If session exists but insert fails → use API route solution

---

## Implementation Priority

1. **IMMEDIATE:** Check if user session exists (add console log)
2. **SHORT-TERM:** Create `/api/jobs/create` route
3. **MEDIUM-TERM:** Fix supabase client singleton
4. **LONG-TERM:** Audit all direct Supabase inserts, move to API routes

---

## Why 401 Instead of RLS Error?

**401 Unauthorized** = No auth token sent with request
**RLS Policy Error** = Auth token sent, but user doesn't pass policy

The RLS fix worked (user has org membership), but the **authentication layer** is failing to attach the JWT token to the request.


