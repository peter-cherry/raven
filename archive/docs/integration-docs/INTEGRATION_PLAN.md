> Archived on 2026-01-12 from INTEGRATION_PLAN.md. Reason: Historical planning document

# 🔗 INTEGRATION PLAN: SLA + Dispatch + Outreach

## Overview
Integrate 3 systems into existing Ravensearch codebase while maintaining design consistency.

---

## PART 1: SLA TIMERS SYSTEM

### Database Changes

**File**: `supabase/migrations/20251023_sla_timers.sql`
```sql
-- Add SLA columns to existing jobs table
ALTER TABLE jobs ADD COLUMN sla_config JSONB;
ALTER TABLE jobs ADD COLUMN sla_started_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN sla_breached BOOLEAN DEFAULT FALSE;

-- SLA timer states
CREATE TABLE sla_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL, -- 'dispatch', 'assignment', 'arrival', 'completion'
  target_minutes INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  breached BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SLA alerts/escalations
CREATE TABLE sla_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  timer_id UUID REFERENCES sla_timers(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL, -- 'warning', 'breach', 'escalation'
  message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sla_timers_job ON sla_timers(job_id);
CREATE INDEX idx_sla_alerts_job ON sla_alerts(job_id);
```

### Backend Functions

**File**: `supabase/functions/sla-timer-engine/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Check all active timers
  const { data: timers } = await supabase
    .from('sla_timers')
    .select('*')
    .is('completed_at', null)
    .eq('breached', false)

  for (const timer of timers || []) {
    const elapsed = (Date.now() - new Date(timer.started_at).getTime()) / 60000
    const remaining = timer.target_minutes - elapsed

    // Warning at 25% remaining
    if (remaining > 0 && remaining < timer.target_minutes * 0.25) {
      await supabase.from('sla_alerts').insert({
        job_id: timer.job_id,
        timer_id: timer.id,
        alert_type: 'warning',
        message: `${timer.stage} timer at 25% remaining`
      })
    }

    // Breach
    if (elapsed >= timer.target_minutes) {
      await supabase
        .from('sla_timers')
        .update({ breached: true })
        .eq('id', timer.id)

      await supabase.from('sla_alerts').insert({
        job_id: timer.job_id,
        timer_id: timer.id,
        alert_type: 'breach',
        message: `${timer.stage} timer breached`
      })
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Frontend Components

**File**: `components/SLABadge.tsx`
```tsx
'use client'

interface SLABadgeProps {
  status: 'on-time' | 'warning' | 'breached'
  timeRemaining?: number // minutes
}

export function SLABadge({ status, timeRemaining }: SLABadgeProps) {
  const colors = {
    'on-time': { bg: 'rgba(16, 185, 129, 0.2)', text: 'var(--success)' },
    'warning': { bg: 'rgba(245, 158, 11, 0.2)', text: 'var(--warning)' },
    'breached': { bg: 'rgba(239, 68, 68, 0.2)', text: 'var(--error)' }
  }

  const { bg, text } = colors[status]

  return (
    <div
      className="score-badge"
      style={{ background: bg, color: text }}
    >
      {status === 'on-time' && '🟢 On Time'}
      {status === 'warning' && `⚠️ ${timeRemaining}m`}
      {status === 'breached' && '🔴 Breached'}
    </div>
  )
}
```

**File**: `components/SLASettings.tsx`
```tsx
'use client'

interface SLASettingsProps {
  trade: string
  urgency: string
  onChange: (config: SLAConfig) => void
}

export function SLASettings({ trade, urgency, onChange }: SLASettingsProps) {
  // Auto-configure based on trade + urgency
  const defaults = {
    'HVAC-emergency': { dispatch: 15, assignment: 30, arrival: 60, completion: 240 },
    'HVAC-same_day': { dispatch: 30, assignment: 60, arrival: 180, completion: 480 },
    // ... more configs
  }

  const config = defaults[`${trade}-${urgency}`] || defaults['HVAC-same_day']

  return (
    <div className="container-card" style={{ padding: '16px' }}>
      <div className="form-label">SLA Timer Settings</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <div className="form-field">
          <label className="form-label" style={{ fontSize: 12 }}>Dispatch</label>
          <input
            className="text-input"
            type="number"
            value={config.dispatch}
            onChange={(e) => onChange({ ...config, dispatch: +e.target.value })}
            style={{ padding: '8px' }}
          />
        </div>
        <div className="form-field">
          <label className="form-label" style={{ fontSize: 12 }}>Assignment</label>
          <input className="text-input" type="number" value={config.assignment} style={{ padding: '8px' }} />
        </div>
        <div className="form-field">
          <label className="form-label" style={{ fontSize: 12 }}>Arrival</label>
          <input className="text-input" type="number" value={config.arrival} style={{ padding: '8px' }} />
        </div>
        <div className="form-field">
          <label className="form-label" style={{ fontSize: 12 }}>Completion</label>
          <input className="text-input" type="number" value={config.completion} style={{ padding: '8px' }} />
        </div>
      </div>
    </div>
  )
}
```

**File**: `components/SLAModal.tsx`
```tsx
'use client'

interface SLAModalProps {
  jobId: string
  isOpen: boolean
  onClose: () => void
}

export function SLAModal({ jobId, isOpen, onClose }: SLAModalProps) {
  if (!isOpen) return null

  return (
    <div className="policy-modal-overlay" onClick={onClose}>
      <div className="policy-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="policy-list">
          <h2 className="header-title" style={{ fontSize: 18, marginBottom: 16 }}>SLA Timers</h2>

          {/* Timer stages */}
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="container-card" style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Dispatch</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>15 minutes target</div>
                </div>
                <SLABadge status="on-time" />
              </div>
              <div style={{ marginTop: 8, height: 4, background: 'var(--border-subtle)', borderRadius: 2 }}>
                <div style={{ width: '60%', height: '100%', background: 'var(--success)', borderRadius: 2 }} />
              </div>
            </div>

            {/* Repeat for other stages */}
          </div>

          <button className="outline-button" onClick={onClose} style={{ marginTop: 16 }}>Close</button>
        </div>
      </div>
    </div>
  )
}
```

### Modified Pages

**File**: `app/jobs/page.tsx` (lines 101-114)
```tsx
// BEFORE
<Link key={j.id} href={`/jobs/${j.id}`} className="container-card">
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
    <div>
      <div style={{ fontWeight: 700 }}>{j.job_title}</div>
      <div style={{ color: 'var(--text-secondary)' }}>{j.trade_needed} • {j.city ?? ''} {j.state ?? ''}</div>
    </div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span className="outline-button" style={{ padding: '6px 12px', fontSize: 12 }}>{j.job_status ?? 'pending'}</span>
      {j.scheduled_at && <span style={{ color: 'var(--text-secondary)' }}>{new Date(j.scheduled_at).toLocaleString()}</span>}
    </div>
  </div>
</Link>

// AFTER
<Link key={j.id} href={`/jobs/${j.id}`} className="container-card">
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
    <div>
      <div style={{ fontWeight: 700 }}>{j.job_title}</div>
      <div style={{ color: 'var(--text-secondary)' }}>{j.trade_needed} • {j.city ?? ''} {j.state ?? ''}</div>
    </div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <SLABadge status={calculateSLAStatus(j)} />
      <span className="outline-button" style={{ padding: '6px 12px', fontSize: 12 }}>{j.job_status ?? 'pending'}</span>
      {j.scheduled_at && <span style={{ color: 'var(--text-secondary)' }}>{new Date(j.scheduled_at).toLocaleString()}</span>}
    </div>
  </div>
</Link>
```

**File**: `app/jobs/create/page.tsx` (after line 384)
```tsx
// Add after trade selection
<SLASettings
  trade={parsed?.trade_needed || 'HVAC'}
  urgency={parsed?.urgency || 'within_week'}
  onChange={(config) => setSLAConfig(config)}
/>
```

---

## PART 2: DISPATCH SYSTEM

### Database Changes

**File**: `supabase/migrations/20251023_dispatch.sql`
```sql
CREATE TABLE work_order_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  initiated_by UUID REFERENCES auth.users(id),
  total_recipients INTEGER NOT NULL DEFAULT 0,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_opened INTEGER NOT NULL DEFAULT 0,
  replies_received INTEGER NOT NULL DEFAULT 0,
  qualified_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE work_order_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_id UUID NOT NULL REFERENCES work_order_outreach(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  email_opened BOOLEAN DEFAULT FALSE,
  email_opened_at TIMESTAMPTZ,
  reply_received BOOLEAN DEFAULT FALSE,
  reply_received_at TIMESTAMPTZ,
  ai_qualified BOOLEAN DEFAULT FALSE,
  qualification_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Backend Functions

**File**: `supabase/functions/dispatch-work-order/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { job_id } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get job + candidates
  const { data: candidates } = await supabase
    .from('job_candidates')
    .select('technician_id, technicians(id, full_name, email)')
    .eq('job_id', job_id)

  // Create outreach record
  const { data: outreach } = await supabase
    .from('work_order_outreach')
    .insert({
      job_id,
      total_recipients: candidates?.length || 0,
      status: 'in_progress'
    })
    .select()
    .single()

  // Send emails via Instantly.ai
  const INSTANTLY_KEY = Deno.env.get('INSTANTLY_API_KEY')!
  const CAMPAIGN_ID = Deno.env.get('INSTANTLY_CAMPAIGN_ID_HVAC')! // TODO: map by trade

  for (const candidate of candidates || []) {
    const tech = candidate.technicians

    // Create recipient record
    await supabase.from('work_order_recipients').insert({
      outreach_id: outreach.id,
      technician_id: tech.id
    })

    // Send via Instantly
    await fetch('https://api.instantly.ai/api/v1/lead/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: INSTANTLY_KEY,
        campaign_id: CAMPAIGN_ID,
        email: tech.email,
        first_name: tech.full_name?.split(' ')[0],
        variables: {
          job_title: job.job_title,
          tracking_id: `${outreach.id}/${tech.id}`
        }
      })
    })
  }

  return new Response(JSON.stringify({ success: true, outreach_id: outreach.id }))
})
```

**File**: `supabase/functions/track-email-open/index.ts`
```typescript
serve(async (req) => {
  const url = new URL(req.url)
  const trackingId = url.searchParams.get('id') // "outreach_id/tech_id"

  const [outreachId, techId] = trackingId?.split('/') || []

  if (outreachId && techId) {
    await supabase
      .from('work_order_recipients')
      .update({
        email_opened: true,
        email_opened_at: new Date().toISOString()
      })
      .match({ outreach_id: outreachId, technician_id: techId })
  }

  // Return 1x1 transparent pixel
  return new Response(
    atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
    { headers: { 'Content-Type': 'image/gif' } }
  )
})
```

### Frontend Components

**File**: `components/DispatchLoader.tsx`
```tsx
'use client'

interface DispatchLoaderProps {
  outreachId: string
}

export function DispatchLoader({ outreachId }: DispatchLoaderProps) {
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    opened: 0,
    qualified: 0
  })

  useEffect(() => {
    const sub = supabase
      .channel(`outreach-${outreachId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'work_order_recipients',
        filter: `outreach_id=eq.${outreachId}`
      }, () => {
        // Refresh stats
        fetchStats()
      })
      .subscribe()

    return () => sub.unsubscribe()
  }, [outreachId])

  return (
    <div className="container-card" style={{ padding: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
        Dispatching to technicians...
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ color: 'var(--text-secondary)' }}>
          ✉️ Reaching {stats.total} technicians...
        </div>
        <div style={{ color: 'var(--warning)' }}>
          👀 {stats.opened} opened so far...
        </div>
        <div style={{ color: 'var(--success)' }}>
          ✅ {stats.qualified} qualified & accepting
        </div>
      </div>

      {/* Animated loader */}
      <div style={{ marginTop: 16, height: 4, background: 'var(--border-subtle)', borderRadius: 2 }}>
        <div
          style={{
            width: `${(stats.sent / stats.total) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #6C72C9, #8083AE)',
            borderRadius: 2,
            transition: 'width 0.3s ease'
          }}
        />
      </div>
    </div>
  )
}
```

### Modified Pages

**File**: `app/page.tsx` (after line 437)
```tsx
// Add [Dispatch to All] button above tech cards in morph mode
{morph && morphCandidates.length > 0 && (
  <button
    className="primary-button"
    onClick={async () => {
      setDispatching(true)
      const res = await fetch('/supabase/functions/v1/dispatch-work-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: morphJobId })
      })
      const { outreach_id } = await res.json()
      setOutreachId(outreach_id)
    }}
    style={{ marginBottom: 16, width: 'fit-content' }}
  >
    📧 Dispatch to All {morphCandidates.length} Technicians
  </button>
)}

{dispatching && outreachId && <DispatchLoader outreachId={outreachId} />}
```

**File**: `app/page.tsx` (modify profile modal)
```tsx
// Add AI Conversation tab to profile modal
<div className="profile-modal-card">
  <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border-subtle)', marginBottom: 12 }}>
    <button
      onClick={() => setActiveTab('profile')}
      style={{
        background: activeTab === 'profile' ? 'var(--accent-primary)' : 'transparent',
        padding: '8px 16px',
        border: 'none',
        color: 'var(--text-primary)',
        cursor: 'pointer'
      }}
    >
      Profile
    </button>
    <button
      onClick={() => setActiveTab('conversation')}
      style={{
        background: activeTab === 'conversation' ? 'var(--accent-primary)' : 'transparent',
        padding: '8px 16px',
        border: 'none',
        color: 'var(--text-primary)',
        cursor: 'pointer'
      }}
    >
      AI Conversation
    </button>
  </div>

  {activeTab === 'profile' && <ProfileContent />}
  {activeTab === 'conversation' && <AIConversation techId={selectedTech.technicians.id} />}
</div>
```

---

## PART 3: COLD OUTREACH SYSTEM

(File too long - will continue in next response...)

---

**Status**: Design System Analysis Complete ✅
**Next**: Present full integration plan for approval

