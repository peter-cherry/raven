'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import { getPolicyScores } from '@/lib/compliance';
import { SLASettings, type SLAConfig } from '@/components/SLASettings';
import './mobile-fix.css';

const phoneRegex = /^(\+?1?\s*)?(\(\d{3}\)\s?\d{3}-\d{4}|\d{3}-\d{3}-\d{4})$/;

const FormSchema = z.object({
  job_title: z.string().min(1).max(200),
  description: z.string().optional(),
  trade_needed: z.enum(['HVAC','Plumbing','Electrical','Handyman','Facilities Tech','Other']),
  required_certifications: z.array(z.string()).optional().default([]),
  address_text: z.string().min(1),
  scheduled_start_ts: z.string().min(1),
  duration: z.string().optional(),
  urgency: z.enum(['emergency','same_day','next_day','within_week','flexible']),
  budget_min: z.coerce.number().optional(),
  budget_max: z.coerce.number().optional(),
  pay_rate: z.string().optional(),
  contact_name: z.string().min(1),
  contact_phone: z.string().regex(phoneRegex, 'Phone must be (555) 123-4567 or 555-123-4567'),
  contact_email: z.string().email(),
});

type FormData = z.infer<typeof FormSchema>;

async function geocodeAddress(query: string) {
  try {
    const res = await fetch(`/api/maps/geocode?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (typeof data.lat === 'number' && typeof data.lng === 'number') {
        return { success: true, lat: data.lat, lng: data.lng, city: data.city ?? null, state: data.state ?? null } as const;
      }
    }
  } catch {}
  // Fallback center (for testing when geocoding is unavailable)
  return { success: true, lat: 25.7634961, lng: -80.1905671, city: null, state: null } as const;
}


function CreateJobPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [scores, setScores] = useState<any[] | null>(null);
  const [techMap, setTechMap] = useState<Record<string, { id: string; full_name: string | null; city: string | null; state: string | null }>>({});
  const [reasonsFor, setReasonsFor] = useState<any | null>(null);
  const [slaConfig, setSlaConfig] = useState<SLAConfig>({ dispatch: 60, assignment: 120, arrival: 240, completion: 480 });
  const [currentTrade, setCurrentTrade] = useState<string>('HVAC');
  const [currentUrgency, setCurrentUrgency] = useState<string>('within_week');

  useEffect(() => {
    const policyId = params?.get('policy_id');
    if (!policyId) return;
    getPolicyScores(policyId)
      .then(async (d) => {
        const sorted = (d ?? []).sort((a: any, b: any) => b.score - a.score);
        setScores(sorted);
        const topIds = sorted.slice(0, 5).map((x: any) => x.technician_id);
        if (topIds.length) {
          const { data } = await supabase.from('technicians').select('id, full_name, city, state').in('id', topIds);
          const map: Record<string, any> = {};
          (data ?? []).forEach((t: any) => { map[t.id] = t; });
          setTechMap(map);
        }
      })
      .catch(() => setScores([]));
  }, [params]);

  const [parseKey, setParseKey] = useState(0);
  const [parsed, setParsed] = useState<any | null>(null);
  const [parsing, setParsing] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);

  useEffect(() => {
    console.log('[parsed state updated]', { parseKey, parsed: JSON.stringify(parsed, null, 2) });
  }, [parsed, parseKey]);

  useEffect(() => {
    const raw = params?.get('raw');
    if (!raw) return;
    setRawText(raw); // Store raw text for database insert
    const doParse = async () => {
      setParsing(true);
      try {
        const res = await fetch('/api/work-orders/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ raw_text: raw }) });
        const j = await res.json();
        console.log('[Parser API Response]', { ok: res.ok, status: res.status });
        if (res.ok && j?.data) {
          console.log('[Using API parsed data]', JSON.stringify(j.data, null, 2));
          console.log('scheduled_start_ts:', j.data.scheduled_start_ts);
          console.log('contact_phone:', j.data.contact_phone);
          setParsed(j.data);
          setParseKey((k)=>k+1);
        } else {
          console.log('[Parser API failed, using heuristic]');
          const guess = basicHeuristicParse(raw);
          console.log('[Using heuristic parsed data]', JSON.stringify(guess, null, 2));
          console.log('scheduled_start_ts:', guess.scheduled_start_ts);
          console.log('contact_phone:', guess.contact_phone);
          setParsed(guess);
          setParseKey((k)=>k+1);
        }
      } catch (err) {
        console.error('[Parser error]', err);
        const guess = basicHeuristicParse(raw);
        console.log('[Using heuristic fallback]', JSON.stringify(guess, null, 2));
        setParsed(guess);
        setParseKey((k)=>k+1);
      } finally {
        setParsing(false);
      }
    };
    doParse();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function basicHeuristicParse(text: string) {
    const clean = text.replace(/\u2013|\u2014/g, '-');
    const email = (clean.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0] || '';

    // Enhanced phone number matching - normalize to (XXX) XXX-XXXX format for Twilio compatibility
    const phoneRaw = clean.match(/(\+?1?\s*)?(\(?\d{3}\)?[\s.-]?)(\d{3}[\s.-]?)(\d{4})/);
    let phone = '';
    if (phoneRaw && phoneRaw[2] && phoneRaw[3] && phoneRaw[4]) {
      const area = phoneRaw[2].replace(/\D/g, '');
      const prefix = phoneRaw[3].replace(/\D/g, '');
      const line = phoneRaw[4].replace(/\D/g, '');
      phone = `(${area}) ${prefix}-${line}`;
    }

    const tradeRaw = (/hvac|air\s*conditioning|plumb|electr|handyman|facility|facilities/i.exec(clean)?.[0] || 'HVAC');
    const trade_needed = /electr/i.test(tradeRaw) ? 'Electrical' : /plumb/i.test(tradeRaw) ? 'Plumbing' : /handyman/i.test(tradeRaw) ? 'Handyman' : /facility|facilities/i.test(tradeRaw) ? 'Facilities Tech' : 'HVAC';

    const title = clean.slice(0, 100).replace(/\s+/g, ' ').trim();
    const address = (clean.match(/\d+\s+[^,\n]+,?\s*[^,\n]+,?\s*[A-Z]{2}\s*\d{5}?/) || [])[0] || '';

    // Enhanced date/time parsing - support multiple formats
    let scheduled_start_ts = '';
    const toLocalInput = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    // Try multiple date formats
    const dateMDY = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    const dateISO = clean.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    const dateNamed = clean.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})/i);
    const timeMatch = clean.match(/(\d{1,2}):(\d{2})?\s*(am|pm)?/i);

    if (dateMDY) {
      const m = parseInt(dateMDY[1]);
      const d = parseInt(dateMDY[2]);
      const y = parseInt(dateMDY[3]) < 100 ? 2000 + parseInt(dateMDY[3]) : parseInt(dateMDY[3]);
      let hour = 9;
      let minute = 0;
      if (timeMatch) {
        hour = parseInt(timeMatch[1]);
        minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        if (timeMatch[3] && timeMatch[3].toLowerCase() === 'pm' && hour < 12) hour += 12;
        if (timeMatch[3] && timeMatch[3].toLowerCase() === 'am' && hour === 12) hour = 0;
      }
      scheduled_start_ts = toLocalInput(new Date(y, m - 1, d, hour, minute));
    } else if (dateISO) {
      const y = parseInt(dateISO[1]);
      const m = parseInt(dateISO[2]);
      const d = parseInt(dateISO[3]);
      let hour = 9;
      let minute = 0;
      if (timeMatch) {
        hour = parseInt(timeMatch[1]);
        minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        if (timeMatch[3] && timeMatch[3].toLowerCase() === 'pm' && hour < 12) hour += 12;
        if (timeMatch[3] && timeMatch[3].toLowerCase() === 'am' && hour === 12) hour = 0;
      }
      scheduled_start_ts = toLocalInput(new Date(y, m - 1, d, hour, minute));
    } else if (dateNamed) {
      const months: Record<string, number> = {
        'jan': 0, 'january': 0, 'feb': 1, 'february': 1, 'mar': 2, 'march': 2,
        'apr': 3, 'april': 3, 'may': 4, 'jun': 5, 'june': 5, 'jul': 6, 'july': 6,
        'aug': 7, 'august': 7, 'sep': 8, 'september': 8, 'oct': 9, 'october': 9,
        'nov': 10, 'november': 10, 'dec': 11, 'december': 11
      };
      const month = months[dateNamed[1].toLowerCase()];
      const day = parseInt(dateNamed[2]);
      const year = parseInt(dateNamed[3]);
      let hour = 9;
      let minute = 0;
      if (timeMatch) {
        hour = parseInt(timeMatch[1]);
        minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        if (timeMatch[3] && timeMatch[3].toLowerCase() === 'pm' && hour < 12) hour += 12;
        if (timeMatch[3] && timeMatch[3].toLowerCase() === 'am' && hour === 12) hour = 0;
      }
      scheduled_start_ts = toLocalInput(new Date(year, month, day, hour, minute));
    } else if (/\btoday\b/i.test(clean)) {
      const now = new Date(); now.setHours(14,0,0,0); scheduled_start_ts = toLocalInput(now);
    } else if (/\btomorrow\b/i.test(clean)) {
      const now = new Date(); now.setDate(now.getDate()+1); now.setHours(9,0,0,0); scheduled_start_ts = toLocalInput(now);
    }

    // Urgency
    let urgency: 'emergency' | 'same_day' | 'next_day' | 'within_week' | 'flexible' = 'within_week';
    if (/emergency|critical|asap|immediately/i.test(clean)) urgency = 'emergency';
    else if (/today|same\s*day/i.test(clean)) urgency = 'same_day';
    else if (/tomorrow|next\s*day/i.test(clean)) urgency = 'next_day';
    else if (/week/i.test(clean)) urgency = 'within_week';

    // Duration
    let duration = '';
    const durRange = clean.match(/(\d+)\s*[-–]\s*(\d+)\s*(hours|hrs|h)\b/i);
    const durSingle = clean.match(/\b(\d+)\s*(hours|hrs|h)\b/i);
    const restoreWithin = clean.match(/within\s+(\d+)\s*(hours|hrs|h)/i);
    if (durRange) duration = `${durRange[1]}-${durRange[2]} hours`;
    else if (restoreWithin) duration = `${restoreWithin[1]} hours`;
    else if (durSingle) duration = `${durSingle[1]} hours`;

    // Budget min/max
    const money = Array.from(clean.matchAll(/\$\s?([\d,]+(?:\.\d{2})?)/g)).map(m => Number(m[1].replace(/,/g, '')));
    let budget_min: number | undefined = undefined;
    let budget_max: number | undefined = undefined;
    const nte = clean.match(/NTE|not\s*to\s*exceed|budget/i);
    if (nte && money.length) { budget_max = money[0]; }
    const range = clean.match(/\$\s*[\d,]+\s*[-–]\s*\$\s*[\d,]+/);
    if (range && money.length >= 2) { budget_min = money[0]; budget_max = money[1]; }

    // Pay rate (look for per-hour or flat language; otherwise leave blank)
    let pay_rate = '';
    const perHour = clean.match(/\$\s*[\d,]+\s*\/\s*(hr|hour)/i) || clean.match(/\$\s*[\d,]+\s*(per|\/)?\s*hour/i);
    const flat = clean.match(/\$\s*[\d,]+\s*(flat|fixed)/i);
    if (perHour) pay_rate = perHour[0].replace(/\s+/g,' ').trim();
    else if (flat) pay_rate = flat[0].replace(/\s+/g,' ').trim();

    // Contact name: prefer "Requested By:" or "Contact:" lines
    let contact_name = '';
    const reqBy = clean.match(/Requested\s*By:\s*([A-Za-z][A-Za-z\s\-']{2,60})/i);
    const contactBy = clean.match(/Contact:\s*([A-Za-z][A-Za-z\s\-']{2,60})/i);
    if (reqBy) contact_name = reqBy[1].trim();
    else if (contactBy) contact_name = contactBy[1].trim();

    return {
      job_title: title,
      description: text,
      trade_needed,
      address_text: address,
      scheduled_start_ts,
      urgency,
      duration,
      budget_min,
      budget_max,
      pay_rate,
      contact_name,
      contact_phone: phone,
      contact_email: email,
    };
  }

  return (
    <main className="create-work-order-page">
        <style jsx>{`
        .form-label, .text-input, .select-input, .textarea-input, .primary-button {
          font-family: var(--ds-font-sans) !important;
        }
        /* Fix datetime-local field alignment */
        .text-input[type="datetime-local"] {
          width: 100% !important;
          padding: 12px 16px !important;
          line-height: normal !important;
          box-sizing: border-box !important;
          height: auto !important;
          max-width: 100% !important;
        }

        /* Shimmer loading animation - light theme */
        @keyframes shimmer {
          0% { background-position: -1200px 0; }
          100% { background-position: 1200px 0; }
        }

        .shimmer-loading {
          animation: shimmer 3.5s infinite ease-in-out !important;
          background-image: linear-gradient(
            90deg,
            var(--ds-bg-elevated) 0%,
            var(--ds-bg-subtle) 20%,
            var(--ds-border-default) 40%,
            var(--ds-bg-subtle) 60%,
            var(--ds-bg-elevated) 100%
          ) !important;
          background-color: transparent !important;
          background-size: 1200px 100% !important;
          background-repeat: no-repeat !important;
          color: transparent !important;
          pointer-events: none !important;
        }

        .shimmer-loading::placeholder {
          color: transparent !important;
        }

        @media (max-width: 768px) {
          .text-input[type="datetime-local"] {
            max-width: calc(100% - 34px) !important;
          }
        }
      `}</style>
      <div className="form-wrapper">
        {scores && (
          <div className="container-card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Top matches for policy (preview)</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {scores.slice(0,5).map((s: any, idx: number) => {
                const t = techMap[s.technician_id];
                return (
                  <div key={s.technician_id} className="container-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 18, textAlign: 'right', fontWeight: 700 }}>{idx+1}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{t?.full_name ?? s.technician_id.slice(0,8)}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t?.city ?? ''} {t?.state ?? ''}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`mini-dot ${(s.passed_requirements ?? []).some((r:any)=>r.type==='COI_VALID') ? 'dot-green':'dot-amber'}`} title="COI" />
                      <span className={`mini-dot ${(s.passed_requirements ?? []).some((r:any)=>r.type==='LICENSE_STATE') ? 'dot-green':'dot-amber'}`} title="License" />
                      <span className={`score-badge ${s.score >= 80 ? 'high' : s.score >= 60 ? 'medium' : 'low'}`}>{s.score}</span>
                      <button className="outline-button" onClick={() => setReasonsFor(s)}>See Reasons</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {reasonsFor && (
          <div className="policy-modal-overlay" onClick={() => setReasonsFor(null)}>
            <div className="policy-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="policy-list">
                <div className="header-title" style={{ fontSize: 18 }}>Reasons for {techMap[reasonsFor.technician_id]?.full_name ?? reasonsFor.technician_id.slice(0,8)}</div>
                <div>
                  <div style={{ fontWeight: 700, marginTop: 8 }}>Passed</div>
                  <ul>
                    {(reasonsFor.passed_requirements ?? []).map((r: any, i: number) => (<li key={i}>{r.type}</li>))}
                  </ul>
                  <div style={{ fontWeight: 700, marginTop: 8 }}>Failed</div>
                  <ul>
                    {(reasonsFor.failed_requirements ?? []).map((r: any, i: number) => (<li key={i}>{r.type}</li>))}
                  </ul>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="outline-button" onClick={() => setReasonsFor(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
        <form key={parseKey} className="card form-grid" style={{ padding: 'var(--ds-space-6)' }} onSubmit={async (e) => {
          e.preventDefault();
          setErrors({});
          setSubmitting(true);
          const fd = new globalThis.FormData(e.currentTarget as HTMLFormElement);
          const payload: Partial<FormData> = {
            job_title: String(fd.get('job_title') || ''),
            description: String(fd.get('description') || ''),
            trade_needed: String(fd.get('trade_needed') || 'HVAC') as any,
            address_text: String(fd.get('address_text') || ''),
            scheduled_start_ts: String(fd.get('scheduled_start_ts') || ''),
            duration: String(fd.get('duration') || ''),
            urgency: String(fd.get('urgency') || 'within_week') as any,
            budget_min: fd.get('budget_min') ? Number(fd.get('budget_min')) : undefined,
            budget_max: fd.get('budget_max') ? Number(fd.get('budget_max')) : undefined,
            pay_rate: String(fd.get('pay_rate') || ''),
            contact_name: String(fd.get('contact_name') || ''),
            contact_phone: String(fd.get('contact_phone') || ''),
            contact_email: String(fd.get('contact_email') || ''),
          };
          console.log('[Form submission] Payload:', JSON.stringify(payload, null, 2));
          const parsed = FormSchema.safeParse(payload);
          if (!parsed.success) {
            console.error('[Form validation failed]', parsed.error.issues);
            const errs: Record<string, string> = {};
            for (const issue of parsed.error.issues) errs[issue.path.join('.')] = issue.message;
            setErrors(errs);
            setSubmitting(false);
            return;
          }
          console.log('[Form validation passed]');

          const geo = await geocodeAddress(parsed.data.address_text);
          if (!geo.success) {
            setErrors({ address_text: 'Unable to find address' });
            setSubmitting(false);
            return;
          }

          // Get user's organization - create one if they don't have one
          let orgId = null;
          if (user) {
            console.log('[Fetching org for user via API]', user.id);

            try {
              const orgResponse = await fetch('/api/organizations/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.id,
                  userEmail: user.email
                })
              });

              const orgData = await orgResponse.json();

              if (!orgResponse.ok) {
                console.error('[Organization API error]', orgData);
                setErrors({ form: 'Failed to create organization: ' + (orgData.error || 'Unknown error') });
                setSubmitting(false);
                return;
              }

              orgId = orgData.orgId;
              console.log('[Got org ID]', orgId);
            } catch (error: any) {
              console.error('[Organization API request failed]', error);
              setErrors({ form: 'Failed to create organization: ' + error.message });
              setSubmitting(false);
              return;
            }
          } else {
            // For guest users (testing), use a default test organization
            console.log('[No user logged in, using guest organization]');
            try {
              const guestResponse = await fetch('/api/organizations/setup-guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });

              const guestData = await guestResponse.json();

              if (guestResponse.ok && guestData.orgId) {
                orgId = guestData.orgId;
                console.log('[Using guest org ID]', orgId);
              } else {
                console.error('[Guest org API error]', guestData);
              }
            } catch (error: any) {
              console.error('[Guest org API request failed]', error);
            }
          }

          if (!orgId) {
            console.error('[No org ID found]');
            setErrors({ form: 'Unable to determine organization. Please contact support.' });
            setSubmitting(false);
            return;
          }

          console.log('[Using org ID]', orgId);

          const { data: job, error } = await supabase
            .from('jobs')
            .insert({
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
              contact_email: parsed.data.contact_email,
              // raw_text: rawText, // TODO: Uncomment after running migration: supabase/migrations/20251029_add_raw_text_to_jobs.sql
              job_status: 'matching',
            })
            .select()
            .single();

          if (error || !job) {
            setErrors({ form: error?.message || 'Failed to create job' });
            setSubmitting(false);
            return;
          }

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
            p_max_distance_m: 40000,
          });

          router.push(`/?job_id=${job.id}&morph=1`);
        }} aria-label="Work order form">
          <h1 style={{ fontSize: 'var(--ds-text-2xl)', fontWeight: 'var(--ds-font-bold)', color: 'var(--ds-text-primary)', marginBottom: 'var(--ds-space-2)' }}>Create Work Order</h1>
          <p style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--ds-space-6)' }}>Provide job details for technician assignment</p>

          <div className="form-grid">
            <div className="form-field">
              <label className="form-label" htmlFor="job_title">Work order title</label>
              <input className={`form-input ${parsing ? 'shimmer-loading' : ''}`} id="job_title" name="job_title" defaultValue={parsed?.job_title || ''} placeholder={!parsed?.job_title ? 'missing info' : undefined} />
              {errors.job_title && <span style={{ color: 'var(--ds-error)', fontSize: 'var(--ds-text-xs)' }}>{errors.job_title}</span>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="description">Description</label>
              <textarea className={`form-input ${parsing ? 'shimmer-loading' : ''}`} id="description" name="description" defaultValue={parsed?.description || ''} placeholder={!parsed?.description ? 'missing info' : undefined} rows={4} />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="trade_needed">Trade needed</label>
              <select
                className={`form-input ${parsing ? 'shimmer-loading' : ''}`}
                id="trade_needed"
                name="trade_needed"
                defaultValue={parsed?.trade_needed || 'HVAC'}
                onChange={(e) => setCurrentTrade(e.target.value)}
              >
                <option>HVAC</option>
                <option>Plumbing</option>
                <option>Electrical</option>
                <option>Handyman</option>
                <option>Facilities Tech</option>
                <option>Other</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="address_text">Address</label>
              <input className={`form-input ${parsing ? 'shimmer-loading' : ''}`} id="address_text" name="address_text" defaultValue={parsed?.address_text || ''} placeholder={!parsed?.address_text ? 'missing info' : undefined} />
              {errors.address_text && <span style={{ color: 'var(--ds-error)', fontSize: 'var(--ds-text-xs)' }}>{errors.address_text}</span>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="scheduled_start_ts">Scheduled start</label>
              <input
                className={`form-input ${parsing ? 'shimmer-loading' : ''}`}
                type="datetime-local"
                id="scheduled_start_ts"
                name="scheduled_start_ts"
                key={`scheduled_start_${parseKey}`}
                defaultValue={parsed?.scheduled_start_ts ? parsed.scheduled_start_ts.substring(0, 16) : ''}
                placeholder={!parsed?.scheduled_start_ts ? 'missing info' : undefined}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="urgency">Urgency</label>
              <select
                className={`form-input ${parsing ? 'shimmer-loading' : ''}`}
                id="urgency"
                name="urgency"
                defaultValue={parsed?.urgency || 'within_week'}
                onChange={(e) => setCurrentUrgency(e.target.value)}
              >
                <option value="emergency">Emergency</option>
                <option value="same_day">Same day</option>
                <option value="next_day">Next day</option>
                <option value="within_week">Within a week</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            {/* SLA Settings - Auto-configures based on trade + urgency */}
            <SLASettings
              trade={currentTrade}
              urgency={currentUrgency}
              onChange={setSlaConfig}
            />

            <div className="form-field">
              <label className="form-label" htmlFor="duration">Duration</label>
              <input className={`form-input ${parsing ? 'shimmer-loading' : ''}`} id="duration" name="duration" placeholder="e.g., 2-3 hours" defaultValue={parsed?.duration || ''} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field">
                <label className="form-label" htmlFor="budget_min">Budget min</label>
                <input className={`form-input ${parsing ? 'shimmer-loading' : ''}`} id="budget_min" name="budget_min" type="number" defaultValue={typeof parsed?.budget_min==='number'? String(parsed?.budget_min): ''} placeholder={parsed && typeof parsed?.budget_min!=='number' ? 'missing info' : undefined} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="budget_max">Budget max</label>
                <input className={`form-input ${parsing ? 'shimmer-loading' : ''}`} id="budget_max" name="budget_max" type="number" defaultValue={typeof parsed?.budget_max==='number'? String(parsed?.budget_max): ''} placeholder={parsed && typeof parsed?.budget_max!=='number' ? 'missing info' : undefined} />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="pay_rate">Pay rate</label>
              <input className={`form-input ${parsing ? 'shimmer-loading' : ''}`} id="pay_rate" name="pay_rate" placeholder="$75/hr" defaultValue={parsed?.pay_rate || ''} />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="contact_name">Contact name</label>
              <input className={`form-input ${parsing ? 'shimmer-loading' : ''}`} id="contact_name" name="contact_name" defaultValue={parsed?.contact_name || ''} placeholder={!parsed?.contact_name ? 'missing info' : undefined} />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="contact_phone">Contact phone</label>
              <input
                className={`form-input ${parsing ? 'shimmer-loading' : ''}`}
                id="contact_phone"
                name="contact_phone"
                key={`contact_phone_${parseKey}`}
                placeholder="(555) 123-4567"
                defaultValue={parsed?.contact_phone || ''}
              />
              {errors.contact_phone && <span style={{ color: 'var(--ds-error)', fontSize: 'var(--ds-text-xs)' }}>{errors.contact_phone}</span>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="contact_email">Contact email</label>
              <input className={`form-input ${parsing ? 'shimmer-loading' : ''}`} id="contact_email" name="contact_email" type="email" defaultValue={parsed?.contact_email || ''} />
            </div>

            {errors.form && <div style={{ color: 'var(--ds-error)' }}>{errors.form}</div>}
            <button className="btn btn-primary" disabled={submitting} type="submit" style={{ width: '100%' }}>Create Work Order</button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function CreateJobPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>}>
      <CreateJobPageContent />
    </Suspense>
  );
}
