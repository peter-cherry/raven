'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useRef } from 'react';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import { getPolicyScores } from '@/lib/compliance';
import { SLASettings, type SLAConfig } from '@/components/SLASettings';
import { CloseButton } from '@/components/CloseButton';
import DuplicateWarningModal from '@/components/DuplicateWarningModal';
import GeocodingWarningModal from '@/components/GeocodingWarningModal';
import { fetchWithRetry } from '@/lib/retryWithBackoff';
import BudgetRangeSlider from '@/components/BudgetRangeSlider';
import DateTimePicker from '@/components/DateTimePicker';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import FormProgressIndicator from '@/components/FormProgressIndicator';
import { useFormAutoSave } from '@/lib/useFormAutoSave';
import { useMultipleDrafts } from '@/lib/useMultipleDrafts';

// Flexible American phone regex - accepts any format with 10 digits
// Examples: (555) 123-4567, 555-123-4567, 555.123.4567, 5551234567, +1 555 123 4567
const phoneRegex = /^(\+?1?\s?)?[\(]?\d{3}[\)]?[\s.-]?\d{3}[\s.-]?\d{4}$/;

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
  contact_phone: z.string().regex(phoneRegex, 'Please enter a valid 10-digit US phone number'),
  contact_email: z.string().email(),
});

type FormData = z.infer<typeof FormSchema>;

async function geocodeAddress(query: string) {
  try {
    // Use server-side proxy to avoid CORS issues with retry logic
    const url = `/api/maps/geocode-nominatim?q=${encodeURIComponent(query)}`;
    const res = await fetchWithRetry(url, undefined, {
      maxRetries: 2,
      initialDelayMs: 500,
      onRetry: (error, attempt, delay) => {
        console.log(`[Geocode] Retry ${attempt}/2 after ${delay}ms: ${error.message}`);
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.lat && data.lng) {
        console.log('[Geocode] Success (Nominatim):', query, '→', data.lat, data.lng);
        return { success: true, lat: data.lat, lng: data.lng, city: data.city, state: data.state } as const;
      } else {
        console.warn('[Geocode] No results from Nominatim');
      }
    }
  } catch (e) {
    console.error('[Geocode] Error after retries:', e);
  }
  // Return failure instead of silent fallback
  console.warn('[Geocode] Failed for:', query);
  return { success: false } as const;
}

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

interface CreateJobFormProps {
  searchText?: string;
  onSuccess?: (jobId: string) => void;
  onClose?: () => void;
  policyId?: string | null; // Optional policy_id from compliance
  selectedDraft?: any; // Draft data to load
  onDraftUpdate?: (draftId: string) => void; // Callback when draft is updated
  jobId?: string | null; // Existing job ID for edit mode (compliance flow)
}

export function CreateJobForm({ searchText, onSuccess, onClose, policyId, selectedDraft, onDraftUpdate, jobId }: CreateJobFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  // Use policyId prop if provided, otherwise check URL params
  const effectivePolicyId = policyId || params?.get('policy_id');
  console.log('[CreateJobForm] policyId prop:', policyId, 'effectivePolicyId:', effectivePolicyId);
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [scores, setScores] = useState<any[] | null>(null);
  const [techMap, setTechMap] = useState<Record<string, { id: string; full_name: string | null; city: string | null; state: string | null }>>({});
  const [reasonsFor, setReasonsFor] = useState<any | null>(null);
  const [slaConfig, setSlaConfig] = useState<SLAConfig>({ dispatch: 60, assignment: 120, arrival: 240, completion: 480 });
  const [currentTrade, setCurrentTrade] = useState<string>('HVAC');
  const [currentUrgency, setCurrentUrgency] = useState<string>('within_week');
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Section refs for progress indicator navigation
  const jobDetailsRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const outerScrollRef = useRef<HTMLDivElement>(null);

  // Duplicate detection state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [pendingJobData, setPendingJobData] = useState<any>(null);

  // Geocoding warning state
  const [showGeocodingWarning, setShowGeocodingWarning] = useState(false);
  const [failedAddress, setFailedAddress] = useState<string>('');

  // New enhancement state
  const [showPasteBanner, setShowPasteBanner] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [budgetRange, setBudgetRange] = useState({ min: 500, max: 2000 });
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [addressValue, setAddressValue] = useState('');
  const [addressGeocode, setAddressGeocode] = useState<{lat: number; lng: number; city?: string; state?: string} | null>(null);
  const [showBudgetSlider, setShowBudgetSlider] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [isEmergency, setIsEmergency] = useState(false);

  // Policy reminder state
  const [policyDetails, setPolicyDetails] = useState<{
    name: string;
    requirements: string[];
  } | null>(null);

  // Multiple drafts system
  const drafts = useMultipleDrafts({
    key: 'work-orders',
    maxDrafts: 10
  });

  // Parsed form state (moved here because it's used in draft save functions below)
  const [parseKey, setParseKey] = useState(0);
  const [parsed, setParsed] = useState<any | null>(null);
  const [parsing, setParsing] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);

  // Track current draft ID
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // Auto-save current form state to draft
  const saveDraftDebounced = useRef<NodeJS.Timeout>();
  const pendingDraftData = useRef<Partial<FormData> | null>(null);

  // Immediate save function (no debounce)
  const saveDraftNow = (data: Partial<FormData>) => {
    const title = data.job_title || parsed?.job_title || 'Untitled Work Order';
    const description = data.description || parsed?.description || '';

    if (currentDraftId) {
      drafts.updateDraft(currentDraftId, data, title, description);
    } else {
      const draft = drafts.saveDraft(data, title, description);
      if (draft) {
        setCurrentDraftId(draft.id);
        if (onDraftUpdate) onDraftUpdate(draft.id);
      }
    }
    pendingDraftData.current = null;
  };

  // Debounced save function
  const saveToDraft = (data: Partial<FormData>) => {
    pendingDraftData.current = data; // Store for cleanup

    if (saveDraftDebounced.current) {
      clearTimeout(saveDraftDebounced.current);
    }

    saveDraftDebounced.current = setTimeout(() => {
      saveDraftNow(data);
    }, 1000); // Reduced to 1 second debounce
  };

  // Save pending draft on unmount
  useEffect(() => {
    return () => {
      if (saveDraftDebounced.current) {
        clearTimeout(saveDraftDebounced.current);
      }
      if (pendingDraftData.current) {
        // Flush pending save immediately on unmount
        const data = pendingDraftData.current;
        const title = data.job_title || parsed?.job_title || 'Untitled Work Order';
        const description = data.description || parsed?.description || '';
        if (currentDraftId) {
          drafts.updateDraft(currentDraftId, data, title, description);
        } else {
          drafts.saveDraft(data, title, description);
        }
      }
    };
  }, [currentDraftId, parsed, drafts]);

  // Load user profile defaults
  const [userDefaults, setUserDefaults] = useState<{ name?: string; email?: string; phone?: string }>({});

  // Load user profile defaults and selected draft
  useEffect(() => {
    if (user) {
      setUserDefaults({
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        email: user.email,
        phone: user.user_metadata?.phone
      });
    }

    // Load selected draft if provided
    if (selectedDraft) {
      console.log('[CreateJobForm] Loading draft:', selectedDraft.id);
      setParsed(selectedDraft.data);
      setCurrentDraftId(selectedDraft.id);
      setParseKey(k => k + 1);

      // Set other state from draft data
      if (selectedDraft.data.address_text) {
        setAddressValue(selectedDraft.data.address_text);
      }
      if (selectedDraft.data.scheduled_start_ts) {
        setScheduledDateTime(selectedDraft.data.scheduled_start_ts);
      }
      if (selectedDraft.data.budget_min || selectedDraft.data.budget_max) {
        setBudgetRange({
          min: selectedDraft.data.budget_min || 500,
          max: selectedDraft.data.budget_max || 2000
        });
        setShowBudgetSlider(true);
      }
      if (selectedDraft.data.urgency === 'emergency') {
        setIsEmergency(true);
      }
    }
  }, [user, selectedDraft]);

  useEffect(() => {
    if (!effectivePolicyId) return;
    getPolicyScores(effectivePolicyId)
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
  }, [effectivePolicyId]);

  // Fetch policy details for reminder display
  useEffect(() => {
    console.log('[Policy Reminder] effectivePolicyId:', effectivePolicyId);
    if (!effectivePolicyId) {
      setPolicyDetails(null);
      return;
    }

    const fetchPolicyDetails = async () => {
      try {
        console.log('[Policy Reminder] Fetching policy items for:', effectivePolicyId);
        // Fetch policy items to build requirements list
        const { data: items, error } = await supabase
          .from('compliance_policy_items')
          .select('requirement_type, metadata')
          .eq('policy_id', effectivePolicyId);

        console.log('[Policy Reminder] Query result:', { items, error });

        if (items && items.length > 0) {
          const requirements: string[] = [];
          items.forEach((item: any) => {
            const type = item.requirement_type;
            const amount = item.metadata?.amount;
            if (type === 'LICENSE_STATE') {
              requirements.push('State License');
            } else if (type === 'GL_COVERAGE' && amount) {
              requirements.push(`GL $${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M`);
            } else if (type === 'AUTO_COVERAGE' && amount) {
              requirements.push(`Auto $${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M`);
            } else if (type === 'WC_COVERAGE') {
              requirements.push('Workers Comp');
            } else if (type === 'ENDORSEMENT_ADDITIONAL_INSURED') {
              requirements.push('Additional Insured');
            } else if (type === 'ENDORSEMENT_WAIVER_SUBROGATION') {
              requirements.push('Waiver of Subrogation');
            }
          });
          setPolicyDetails({
            name: 'Compliance Policy',
            requirements: requirements.slice(0, 4) // Show max 4 items
          });
        }
      } catch (error) {
        console.error('Failed to fetch policy details:', error);
      }
    };

    fetchPolicyDetails();
  }, [effectivePolicyId]);

  // Update budget range and trade from parsed data
  useEffect(() => {
    // Update trade if parsed data has it
    if (parsed?.trade_needed && parsed.trade_needed !== currentTrade) {
      setCurrentTrade(parsed.trade_needed);
    }

    // Update budget range based on selected trade
    const tradeBudgets: Record<string, { min: number; max: number }> = {
      'HVAC': { min: 300, max: 3000 },
      'Electrical': { min: 200, max: 2500 },
      'Plumbing': { min: 250, max: 2000 },
      'Handyman': { min: 150, max: 1500 },
      'Facilities Tech': { min: 200, max: 2500 },
      'Other': { min: 200, max: 2000 }
    };

    const tradeBudget = tradeBudgets[currentTrade];
    if (tradeBudget && !parsed?.budget_min && !parsed?.budget_max) {
      setBudgetRange(tradeBudget);
    }
  }, [currentTrade, parsed]);

  useEffect(() => {
    const raw = searchText || params?.get('raw');
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
  }, [searchText]);

  // Load existing job data when jobId is provided (compliance flow - edit mode)
  useEffect(() => {
    if (!jobId) return;

    const loadJobData = async () => {
      setParsing(true);
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();

        // API returns job data directly (not wrapped in { ok, data })
        if (res.ok && data && data.id) {
          const job = data;
          console.log('[CreateJobForm] Loaded existing job data:', job);

          // Map job fields to parsed format
          const jobAsParsed = {
            job_title: job.job_title || '',
            description: job.description || '',
            trade_needed: job.trade_needed || 'HVAC',
            address_text: job.address_text || '',
            scheduled_start_ts: job.scheduled_at || '',
            duration: job.duration || '',
            urgency: job.urgency || 'within_week',
            budget_min: job.budget_min || 0,
            budget_max: job.budget_max || 0,
            pay_rate: job.pay_rate || '',
            contact_name: job.contact_name || '',
            contact_phone: job.contact_phone || '',
            contact_email: job.contact_email || '',
          };

          setParsed(jobAsParsed);
          setParseKey((k) => k + 1);

          // Update address value for the address input
          if (job.address_text) {
            setAddressValue(job.address_text);
          }
        } else {
          console.error('[CreateJobForm] Failed to load job:', data?.error || 'Unknown error');
        }
      } catch (error) {
        console.error('[CreateJobForm] Error loading job:', error);
      } finally {
        setParsing(false);
      }
    };

    loadJobData();
  }, [jobId]);

  // Helper function to create job (used by both normal flow and "Continue Anyway")
  // Uses the authoritative /api/jobs endpoint which handles the full lifecycle:
  // job creation → compliance policy linking → SLA initialization → technician matching → dispatch
  const createJob = async (jobData: { parsed: any; geo: any; orgId: string }) => {
    const { parsed, geo, orgId } = jobData;

    // Use authoritative /api/jobs endpoint for full lifecycle
    const response = await fetch('/api/jobs', {
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
        contact_email: parsed.data.contact_email,
        policy_id: effectivePolicyId || null,
        sla_config: slaConfig,
        dispatch_immediately: true,
      })
    });

    if (!response.ok) {
      // If unauthorized (401), redirect to sign-in page instead of showing error
      if (response.status === 401) {
        console.log('[Job Creation] Unauthorized - redirecting to sign-in');
        if (typeof window !== 'undefined') {
          window.location.href = '/login?returnUrl=' + encodeURIComponent(window.location.pathname);
        }
        return null;
      }

      const errorData = await response.json();
      console.error('[Job Creation] API error:', errorData);
      setErrors({ form: errorData.error || 'Failed to create job' });
      setSubmitting(false);
      return null;
    }

    const { job, dispatch, duplicate } = await response.json();
    
    if (duplicate) {
      console.log('[Job Creation] Duplicate job returned:', job.id);
    } else {
      console.log('[Job Creation] Success:', job.id, 'Dispatch:', dispatch);
    }

    return job;
  };

  // Handler for "Continue Anyway" from duplicate modal
  const handleContinueAnyway = async () => {
    setShowDuplicateModal(false);
    if (!pendingJobData) return;

    setSubmitting(true);
    const job = await createJob(pendingJobData);

    if (job) {
      setPendingJobData(null);
      setDuplicates([]);
      if (onSuccess) {
        onSuccess(job.id);
      } else {
        router.push(`/?job_id=${job.id}&morph=1`);
      }
    }
  };

  // Handler for "View Existing" from duplicate modal
  const handleViewExisting = (jobId: string) => {
    setShowDuplicateModal(false);
    setPendingJobData(null);
    setDuplicates([]);
    setSubmitting(false);

    // Close the form first if onClose is provided
    if (onClose) {
      onClose();
    }

    // Navigate to jobs overlay with the specific job_id to open JobDetailOverlay
    window.location.href = `/?overlay=jobs&job_id=${jobId}`;
  };

  // Handler for "Cancel" from duplicate modal
  const handleCancelDuplicate = () => {
    setShowDuplicateModal(false);
    setPendingJobData(null);
    setDuplicates([]);
    setSubmitting(false);
  };

  return (
    <div className="workorder-form" style={{ width: '100%' }}>
      <style jsx>{`
        /* Form input styling - Light Theme */
        .text-input, .select-input, .textarea-input {
          background: var(--ds-bg-surface) !important;
          border: 1px solid var(--ds-border-default) !important;
          border-radius: var(--ds-radius-lg) !important;
          color: var(--ds-text-primary) !important;
        }
        
        .text-input:focus, .select-input:focus, .textarea-input:focus {
          border-color: var(--ds-accent-primary) !important;
          box-shadow: 0 0 0 3px var(--ds-accent-primary-light) !important;
        }
        
        .text-input::placeholder, .textarea-input::placeholder {
          color: var(--ds-text-tertiary) !important;
        }
        
        .select-input {
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
        }
        
        .form-label {
          color: var(--ds-text-primary) !important;
          font-weight: var(--ds-font-medium) !important;
          font-size: var(--ds-text-sm) !important;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .container-card {
            width: 100% !important;
            max-width: 100% !important;
            padding: var(--ds-space-4) !important;
          }

          .form-grid {
            grid-template-columns: 1fr !important;
            gap: var(--ds-space-4) !important;
          }

          .text-input, .select-input, .textarea-input {
            font-size: 16px !important;
          }
        }

        /* Shimmer loading animation - Light Theme */
        @keyframes shimmer {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .shimmer-loading {
          animation: shimmer 2s infinite ease-in-out !important;
          background-image: linear-gradient(
            90deg,
            var(--ds-bg-elevated) 0%,
            var(--ds-bg-surface) 20%,
            var(--ds-border-subtle) 40%,
            var(--ds-bg-surface) 60%,
            var(--ds-bg-elevated) 100%
          ) !important;
          background-color: var(--ds-bg-elevated) !important;
          background-size: 600px 100% !important;
          color: transparent !important;
          pointer-events: none !important;
        }

        .shimmer-loading::placeholder {
          color: transparent !important;
        }
      `}</style>
      {scores && (
        <div style={{ marginBottom: 'var(--ds-space-4)', padding: 'var(--ds-space-4)', background: 'var(--ds-bg-muted)', borderRadius: 'var(--ds-radius-lg)', border: '1px solid var(--ds-border-default)' }}>
          <div style={{ fontWeight: 'var(--ds-font-semibold)', marginBottom: 'var(--ds-space-3)', color: 'var(--ds-text-primary)', fontSize: 'var(--ds-text-sm)' }}>Top matches for policy (preview)</div>
          <div style={{ display: 'grid', gap: 'var(--ds-space-2)' }}>
            {scores.slice(0,5).map((s: any, idx: number) => {
              const t = techMap[s.technician_id];
              return (
                <div key={s.technician_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--ds-space-3)', background: 'var(--ds-bg-surface)', borderRadius: 'var(--ds-radius-md)', border: '1px solid var(--ds-border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                    <span style={{ width: 18, textAlign: 'right', fontWeight: 'var(--ds-font-bold)', color: 'var(--ds-text-secondary)', fontSize: 'var(--ds-text-sm)' }}>{idx+1}</span>
                    <div>
                      <div style={{ fontWeight: 'var(--ds-font-medium)', color: 'var(--ds-text-primary)', fontSize: 'var(--ds-text-sm)' }}>{t?.full_name ?? s.technician_id.slice(0,8)}</div>
                      <div style={{ color: 'var(--ds-text-tertiary)', fontSize: 'var(--ds-text-xs)' }}>{t?.city ?? ''} {t?.state ?? ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-3)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: (s.passed_requirements ?? []).some((r:any)=>r.type==='COI_VALID') ? 'var(--ds-success)':'var(--ds-warning)' }} title="COI" />
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: (s.passed_requirements ?? []).some((r:any)=>r.type==='LICENSE_STATE') ? 'var(--ds-success)':'var(--ds-warning)' }} title="License" />
                    <span className={`badge ${s.score >= 80 ? 'badge-success' : s.score >= 60 ? 'badge-warning' : 'badge-error'}`}>{s.score}</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => setReasonsFor(s)}>See Reasons</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {reasonsFor && (
        <div className="modal-overlay" onClick={() => setReasonsFor(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header modal-header-sidebar-style">
              <h3 className="modal-title">Reasons for {techMap[reasonsFor.technician_id]?.full_name ?? reasonsFor.technician_id.slice(0,8)}</h3>
              <button onClick={() => setReasonsFor(null)} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 'var(--ds-space-4)' }}>
                <div style={{ fontWeight: 'var(--ds-font-semibold)', color: 'var(--ds-success)', marginBottom: 'var(--ds-space-2)' }}>Passed</div>
                <ul style={{ margin: 0, paddingLeft: 'var(--ds-space-4)', color: 'var(--ds-text-primary)' }}>
                  {(reasonsFor.passed_requirements ?? []).map((r: any, i: number) => (<li key={i} style={{ marginBottom: 'var(--ds-space-1)' }}>{r.type}</li>))}
                </ul>
              </div>
              <div>
                <div style={{ fontWeight: 'var(--ds-font-semibold)', color: 'var(--ds-error)', marginBottom: 'var(--ds-space-2)' }}>Failed</div>
                <ul style={{ margin: 0, paddingLeft: 'var(--ds-space-4)', color: 'var(--ds-text-primary)' }}>
                  {(reasonsFor.failed_requirements ?? []).map((r: any, i: number) => (<li key={i} style={{ marginBottom: 'var(--ds-space-1)' }}>{r.type}</li>))}
                </ul>
              </div>
            </div>
            <div className="modal-footer modal-footer-sidebar-style">
              <button className="btn btn-secondary" onClick={() => setReasonsFor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      <form key={parseKey} className="card" style={{ 
        background: 'var(--ds-bg-surface)', 
        border: '1px solid var(--ds-border-default)', 
        borderRadius: 'var(--ds-radius-2xl)', 
        position: 'relative', 
        maxWidth: 1100, 
        maxHeight: '90vh', 
        padding: 0, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        boxShadow: 'var(--ds-shadow-lg)'
      }} onKeyDown={(e) => {
        // Prevent Enter key from submitting form unless on submit button
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') {
          e.preventDefault();
        }
      }} onSubmit={async (e) => {
        e.preventDefault();
        setErrors({});
        setSubmitting(true);
        setSubmitState('submitting');
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
          setSubmitState('idle');
          return;
        }
        console.log('[Form validation passed]');

        // Validate that address contains a street name (not just city/state)
        const address = parsed.data.address_text.trim();
        const hasStreetName = /\d+\s+[A-Za-z]/i.test(address) || // Has street number + name (e.g., "123 Main")
                              /[A-Za-z]+\s+(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|ct|court|pl|place)/i.test(address); // Has street suffix

        if (!hasStreetName) {
          setErrors({ address_text: 'Please provide a complete street address, not just a city or state' });
          setSubmitting(false);
          setSubmitState('idle');
          return;
        }

        const geo = await geocodeAddress(parsed.data.address_text);
        if (!geo.success) {
          // Show warning modal instead of silent error
          setFailedAddress(parsed.data.address_text);
          setShowGeocodingWarning(true);
          setSubmitting(false);
          setSubmitState('idle');
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

        // Check for duplicates before creating job
        try {
          const dupResponse = await fetch('/api/work-orders/check-duplicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: parsed.data.address_text,
              trade: parsed.data.trade_needed,
              org_id: orgId,
              exclude_id: jobId || undefined  // Exclude current job if editing
            })
          });

          const dupData = await dupResponse.json();

          if (dupData.hasDuplicates && dupData.duplicates.length > 0) {
            // Store pending job data and show duplicate modal
            setPendingJobData({ parsed, geo, orgId });
            setDuplicates(dupData.duplicates);
            setShowDuplicateModal(true);
            setSubmitting(false);
            return;
          }
        } catch (error) {
          console.error('[Duplicate check failed]', error);
          // Continue anyway if check fails
        }

        // If jobId is provided (edit mode from compliance flow), use existing job
        if (jobId) {
          console.log('[CreateJobForm] Edit mode - using existing jobId:', jobId);
          setSubmitState('success');
          setSubmitting(false);

          // Delete the draft on successful submission
          if (currentDraftId) {
            drafts.deleteDraft(currentDraftId);
          }

          setTimeout(() => {
            if (onSuccess) {
              onSuccess(jobId);
            } else {
              router.push(`/?job_id=${jobId}&morph=1`);
            }
          }, 800);
          return;
        }

        // No duplicates found - create job
        const job = await createJob({ parsed, geo, orgId });

        if (job) {
          // Show success state briefly
          setSubmitState('success');
          setSubmitting(false);
          
          // Delete the draft on successful submission
          if (currentDraftId) {
            drafts.deleteDraft(currentDraftId);
          }

          setTimeout(() => {
            if (onSuccess) {
              onSuccess(job.id);
            } else {
              router.push(`/?job_id=${job.id}&morph=1`);
            }
          }, 800); // Brief delay to show success state
        } else {
          setSubmitState('idle');
          setSubmitting(false);
        }
      }} aria-label="Work order form">
        {/* Header buttons - Emergency toggle and Close */}
        <div style={{ position: 'absolute', top: 'var(--ds-space-4)', right: 'var(--ds-space-4)', zIndex: 10, display: 'flex', alignItems: 'center', gap: 'var(--ds-space-3)' }}>
          {/* Emergency Toggle */}
          <button
            type="button"
            onClick={() => setIsEmergency(!isEmergency)}
            className={isEmergency ? 'btn btn-danger btn-sm' : 'btn btn-secondary btn-sm'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--ds-space-2)',
              background: isEmergency ? 'var(--ds-error-bg)' : 'var(--ds-bg-surface)',
              border: `1px solid ${isEmergency ? 'var(--ds-error)' : 'var(--ds-border-default)'}`,
              color: isEmergency ? 'var(--ds-error)' : 'var(--ds-text-secondary)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Emergency
          </button>

          {/* Close button */}
          {onClose && <CloseButton onClick={onClose} />}
        </div>

        {/* Fixed Header */}
        <div className="workorder-form__header" style={{ padding: 'var(--ds-space-6)', borderBottom: '1px solid var(--ds-border-subtle)', background: 'var(--ds-bg-muted)' }}>
          <h1 className="workorder-form__title" style={{ fontSize: 'var(--ds-text-xl)', fontWeight: 'var(--ds-font-bold)', color: 'var(--ds-text-primary)', margin: 0, marginBottom: 'var(--ds-space-1)' }}>Create work order</h1>
          <p className="workorder-form__subtitle" style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-secondary)', margin: 0 }}>Provide job details for technician assignment</p>

          {/* Draft indicator */}
          {currentDraftId && (
            <div style={{
              fontSize: 'var(--ds-text-xs)',
              color: 'var(--ds-success)',
              marginTop: 'var(--ds-space-2)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--ds-space-1)'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Draft auto-saving...
            </div>
          )}

          {/* Paste Detection Banner */}
          {showPasteBanner && !parsed && (
            <div className="info-box" style={{
              marginTop: 'var(--ds-space-4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--ds-space-4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-3)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ds-info)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <div>
                  <div style={{
                    fontSize: 'var(--ds-text-sm)',
                    fontWeight: 'var(--ds-font-semibold)',
                    color: 'var(--ds-info-text)',
                    marginBottom: '2px'
                  }}>
                    Pro Tip
                  </div>
                  <div style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-secondary)' }}>
                    Paste a work order description and we'll auto-fill the form for you
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasteBanner(false)}
                className="btn btn-ghost"
                style={{ padding: 'var(--ds-space-2)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}

          {/* Progress Indicator - Clickable and Centered */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            padding: 'var(--ds-space-4) 0',
            marginTop: 'var(--ds-space-4)',
            borderTop: '1px solid var(--ds-border-subtle)'
          }}>
            <FormProgressIndicator
              currentStep={currentStep}
              steps={[
                { label: 'Job Details' },
                { label: 'Schedule' },
                { label: 'Contact Info' }
              ]}
              onStepClick={(stepIndex) => {
                const refs = [jobDetailsRef, scheduleRef, contactRef];
                const targetRef = refs[stepIndex];

                if (targetRef?.current && outerScrollRef.current) {
                  const container = outerScrollRef.current;
                  const targetElement = targetRef.current;
                  const containerRect = container.getBoundingClientRect();
                  const targetRect = targetElement.getBoundingClientRect();
                  const scrollOffset = targetRect.top - containerRect.top + container.scrollTop - 20;

                  container.scrollTo({
                    top: scrollOffset,
                    behavior: 'smooth'
                  });
                }
              }}
            />
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div ref={outerScrollRef} className="workorder-form__body" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', zIndex: 1, padding: 'var(--ds-space-6)' }}>
          <div
            ref={scrollRef}
            onScroll={(e) => {
              const target = e.currentTarget;
              setScrollTop(target.scrollTop);
              setIsScrolling(true);

              if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
              }

              scrollTimeoutRef.current = setTimeout(() => {
                setIsScrolling(false);
              }, 150);
            }}
            style={{
              width: '100%',
              height: '100%',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
          >

          <div className="form-section">
          <div ref={jobDetailsRef} className="form-field">
            <label className="form-label" htmlFor="job_title">Work order title</label>
            <input
              className={`text-input ${parsing ? 'shimmer-loading' : ''}`}
              id="job_title"
              name="job_title"
              defaultValue={parsed?.job_title || ''}
              onChange={(e) => {
                // Clear error when user starts typing
                if (e.target.value.trim().length > 0 && errors.job_title) {
                  const { job_title, ...rest } = errors;
                  setErrors(rest);
                }
                // Save draft (debounced)
                saveToDraft({ ...parsed, job_title: e.target.value });
              }}
              onBlur={(e) => {
                // Save immediately when leaving field
                if (e.target.value.trim()) {
                  saveDraftNow({ ...parsed, job_title: e.target.value });
                }
              }}
            />
            {errors.job_title && <span style={{ color: 'var(--ds-error)', fontSize: 'var(--ds-text-xs)' }}>{errors.job_title}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              className="textarea-input"
              id="description"
              name="description"
              defaultValue={parsed?.description || ''}
              placeholder="Enter work order description (optional)"
              onChange={(e) => {
                saveToDraft({ ...parsed, description: e.target.value });
              }}
              onBlur={(e) => {
                // Save immediately when leaving field
                saveDraftNow({ ...parsed, description: e.target.value });
              }}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="trade_needed">Trade needed</label>
            <select
              className={`select-input ${parsing ? 'shimmer-loading' : ''}`}
              id="trade_needed"
              name="trade_needed"
              value={parsing ? '' : (parsed?.trade_needed || '')}
              onChange={(e) => {
                setCurrentTrade(e.target.value);
                saveToDraft({ ...parsed, trade_needed: e.target.value });
              }}
            >
              {parsing && <option value="">Loading...</option>}
              {!parsing && !parsed?.trade_needed && <option value="">Select trade</option>}
              <option>HVAC</option>
              <option>Plumbing</option>
              <option>Electrical</option>
              <option>Handyman</option>
              <option>Facilities Tech</option>
              <option>Other</option>
            </select>
          </div>

          {/* Trade-Specific Fields */}


          <div className="form-field">
            <label className="form-label" htmlFor="address_text">Address</label>
            <AddressAutocomplete
              value={addressValue || parsed?.address_text || ''}
              onChange={(value, geocoded) => {
                setAddressValue(value);
                if (geocoded) {
                  setAddressGeocode(geocoded);
                }
                // Auto-save form data
                saveToDraft({ ...parsed, address_text: value });
                // Update step progress
                if (value && currentStep < 1) setCurrentStep(1);
              }}
              onValidated={(isValid) => {
                if (!isValid && addressValue) {
                  setErrors({ ...errors, address_text: 'Unable to verify address. Please check and try again.' });
                } else {
                  const { address_text, ...rest } = errors;
                  setErrors(rest);
                }
              }}
              placeholder="Enter street address (e.g., 123 Main St, Orlando, FL)"
              error={errors.address_text}
            />
            <input type="hidden" id="address_text" name="address_text" value={addressValue || parsed?.address_text || ''} />
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              We'll verify this address and match you with nearby contractors
            </div>
          </div>

          <div ref={scheduleRef} className="form-field">
            <label className="form-label" htmlFor="scheduled_start_ts">Scheduled start</label>
            <DateTimePicker
              value={scheduledDateTime || parsed?.scheduled_start_ts}
              onChange={(value) => {
                setScheduledDateTime(value);
                // Auto-save form data
                saveToDraft({ ...parsed, scheduled_start_ts: value });
                // Update step progress
                if (value && currentStep < 2) setCurrentStep(2);
              }}
              label="When should this job be completed?"
            />
            <input type="hidden" id="scheduled_start_ts" name="scheduled_start_ts" value={scheduledDateTime || parsed?.scheduled_start_ts || ''} />
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              Use quick picks for common timeframes (ASAP, Tomorrow 9am, etc.)
            </div>
          </div>

          {/* Hidden urgency field - controlled by Emergency toggle in header */}
          <input
            type="hidden"
            id="urgency"
            name="urgency"
            value={isEmergency ? 'emergency' : 'within_week'}
          />

          {/* SLA Settings - Auto-configures based on trade + urgency */}
          <SLASettings
            trade={currentTrade}
            urgency={isEmergency ? 'emergency' : 'within_week'}
            onChange={setSlaConfig}
          />

          <div className="form-field">
            <label className="form-label" htmlFor="duration">Duration</label>
            <input className={`text-input ${parsing ? 'shimmer-loading' : ''}`} id="duration" name="duration" placeholder="e.g., 2-3 hours" defaultValue={parsed?.duration || ''} />
          </div>

          <div className="form-field">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Budget Range</label>
              <button
                type="button"
                onClick={() => setShowBudgetSlider(!showBudgetSlider)}
                className="outline-button"
                style={{ padding: '4px 12px', fontSize: 'var(--font-xs)' }}
              >
                {showBudgetSlider ? 'Use Number Inputs' : 'Use Slider'}
              </button>
            </div>

            {showBudgetSlider ? (
              <>
                <BudgetRangeSlider
                  min={0}
                  max={10000}
                  defaultMin={budgetRange.min}
                  defaultMax={budgetRange.max}
                  onChange={(min, max) => {
                    setBudgetRange({ min, max });
                    // Auto-save
                    saveToDraft({ ...parsed, budget_min: min, budget_max: max });
                  }}
                />
                <input type="hidden" id="budget_min" name="budget_min" value={budgetRange.min} />
                <input type="hidden" id="budget_max" name="budget_max" value={budgetRange.max} />
              </>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 'var(--font-xs)', marginBottom: '4px' }}>Minimum</label>
                  <input
                    className={`text-input ${parsing ? 'shimmer-loading' : ''}`}
                    id="budget_min"
                    name="budget_min"
                    type="number"
                    defaultValue={typeof parsed?.budget_min==='number'? String(parsed?.budget_min): ''}
                    placeholder="$500"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 'var(--font-xs)', marginBottom: '4px' }}>Maximum</label>
                  <input
                    className={`text-input ${parsing ? 'shimmer-loading' : ''}`}
                    id="budget_max"
                    name="budget_max"
                    type="number"
                    defaultValue={typeof parsed?.budget_max==='number'? String(parsed?.budget_max): ''}
                    placeholder="$2000"
                  />
                </div>
              </div>
            )}
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              Optional - Helps match qualified contractors within your budget
            </div>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="pay_rate">Pay rate</label>
            <input className={`text-input ${parsing ? 'shimmer-loading' : ''}`} id="pay_rate" name="pay_rate" placeholder="$75/hr" defaultValue={parsed?.pay_rate || ''} />
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              Optional - Hourly rate or flat fee (e.g., $75/hr or $500 flat)
            </div>
          </div>

          <div ref={contactRef} className="form-field">
            <label className="form-label" htmlFor="contact_name">Contact name</label>
            <input
              className={`text-input ${parsing ? 'shimmer-loading' : ''}`}
              id="contact_name"
              name="contact_name"
              key={`contact_name_${parseKey}`}
              defaultValue={(parsed?.contact_name && parsed.contact_name.trim()) || userDefaults.name || ''}
              onChange={(e) => {
                saveToDraft({ ...parsed, contact_name: e.target.value });
              }}
            />
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              Primary contact for this job
            </div>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="contact_phone">Contact phone</label>
            <input
              className={`text-input ${parsing ? 'shimmer-loading' : ''}`}
              id="contact_phone"
              name="contact_phone"
              key={`contact_phone_${parseKey}`}
              placeholder="(555) 123-4567"
              defaultValue={(parsed?.contact_phone && parsed.contact_phone.trim()) || userDefaults.phone || ''}
              onChange={(e) => {
                saveToDraft({ ...parsed, contact_phone: e.target.value });
              }}
            />
            {errors.contact_phone && <span style={{ color: 'var(--error)', fontSize: 'var(--font-sm)', display: 'block', marginTop: 'var(--spacing-xs)' }}>Use format: (555) 123-4567 or 555-123-4567</span>}
            {!errors.contact_phone && (
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                For contractor to reach you (e.g., (555) 123-4567)
              </div>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="contact_email">Contact email</label>
            <input
              className={`text-input ${parsing ? 'shimmer-loading' : ''}`}
              id="contact_email"
              name="contact_email"
              key={`contact_email_${parseKey}`}
              type="email"
              defaultValue={(parsed?.contact_email && parsed.contact_email.trim()) || userDefaults.email || ''}
              onChange={(e) => {
                saveToDraft({ ...parsed, contact_email: e.target.value });
              }}
            />
            {errors.contact_email && <span style={{ color: 'var(--error)', fontSize: 'var(--font-sm)', display: 'block', marginTop: 'var(--spacing-xs)' }}>Please enter a valid email address (name@company.com)</span>}
            {!errors.contact_email && (
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                Where contractors should send quotes and updates
              </div>
            )}
          </div>

          {errors.form && <div style={{ color: 'var(--error)' }}>{errors.form}</div>}
        </div>

          </div>
        </div>

        {/* Policy Reminder - Above submit button */}
        {(effectivePolicyId || policyDetails) && (
          <div style={{
            padding: 'var(--ds-space-3) var(--ds-space-6)',
            background: 'var(--ds-success-bg)',
            borderTop: '1px solid var(--ds-success-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ds-space-3)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ds-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)', marginBottom: 'var(--ds-space-1)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ds-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ fontSize: 'var(--ds-text-xs)', fontWeight: 'var(--ds-font-semibold)', color: 'var(--ds-success-text)' }}>
                  Compliance Policy Confirmed
                </span>
              </div>
              <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-secondary)', display: 'flex', flexWrap: 'wrap', gap: 'var(--ds-space-2)' }}>
                {policyDetails ? (
                  policyDetails.requirements.length > 0 ? (
                    policyDetails.requirements.map((req, i) => (
                      <span key={i} className="badge badge-success" style={{ fontSize: 'var(--ds-text-xs)' }}>
                        {req}
                      </span>
                    ))
                  ) : <span>Policy requirements set</span>
                ) : <span>Policy confirmed</span>}
              </div>
            </div>
          </div>
        )}

        {/* Sticky Submit Button - Outside scrollable container */}
        <div className="workorder-form__footer" style={{
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
          padding: 'var(--ds-space-5) var(--ds-space-6)',
          background: 'var(--ds-bg-muted)',
          borderTop: '1px solid var(--ds-border-subtle)'
        }}>
          <button 
            className={submitState === 'success' ? 'btn btn-success btn-lg' : 'btn btn-primary btn-lg'} 
            disabled={submitting || submitState === 'submitting'} 
            type="submit" 
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--ds-space-2)'
            }}
          >
            {submitState === 'submitting' || submitting ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" opacity="0.3"/>
                  <path d="M12 2 A10 10 0 0 1 22 12" strokeLinecap="round"/>
                </svg>
                <span>Creating Work Order...</span>
              </>
            ) : submitState === 'success' ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Work Order Created!</span>
              </>
            ) : parsed && Object.keys(parsed).length > 0 ? (
              'Create Work Order from Pasted Details'
            ) : (
              'Create Work Order'
            )}
          </button>
        </div>
      </form>

      {/* Loading Overlay - Clean Light Theme */}
      {(submitState === 'submitting' || submitting) && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            flexDirection: 'column',
            gap: 'var(--ds-space-6)'
          }}
        >
          {/* Large Spinner */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--ds-accent-primary)"
            strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite' }}
          >
            <circle cx="12" cy="12" r="10" opacity="0.2" />
            <path d="M12 2 A10 10 0 0 1 22 12" strokeLinecap="round" />
          </svg>

          {/* Loading Text */}
          <div style={{
            fontSize: 'var(--ds-text-xl)',
            fontWeight: 'var(--ds-font-semibold)',
            color: 'var(--ds-text-primary)',
            textAlign: 'center'
          }}>
            Creating Work Order...
          </div>

          {/* Pulsing dots */}
          <div style={{
            display: 'flex',
            gap: 'var(--ds-space-2)',
            alignItems: 'center'
          }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'var(--ds-accent-primary)',
                  animation: `pulse 1.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      {showDuplicateModal && (
        <DuplicateWarningModal
          duplicates={duplicates}
          onViewExisting={handleViewExisting}
          onContinueAnyway={handleContinueAnyway}
          onCancel={handleCancelDuplicate}
        />
      )}

      {/* Geocoding Warning Modal */}
      {showGeocodingWarning && (
        <GeocodingWarningModal
          address={failedAddress}
          onFixAddress={() => {
            // Close modal and let user fix the address
            setShowGeocodingWarning(false);
            setErrors({ address_text: 'Please fix the address and try again' });
          }}
          onUseFallback={async () => {
            // Close modal and continue with fallback location (Miami)
            setShowGeocodingWarning(false);

            // Get the form element and re-trigger submission with fallback
            const form = document.querySelector('form');
            if (form) {
              const formData = new FormData(form);
              const parsed = FormSchema.safeParse(Object.fromEntries(formData));

              if (parsed.success) {
                // Use fallback Miami coordinates
                const fallbackGeo = {
                  success: true,
                  lat: 25.7634961,
                  lng: -80.1905671,
                  city: 'Miami',
                  state: 'FL'
                };

                // Continue with job creation using fallback
                setSubmitting(true);

                // Get user's organization
                let orgId = null;
                if (user) {
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
                    if (orgResponse.ok) {
                      orgId = orgData.orgId;
                    }
                  } catch (error) {
                    console.error('[Organization API failed]', error);
                  }
                }

                if (orgId) {
                  // Create job with fallback location
                  const job = await createJob({
                    parsed: { data: parsed.data },
                    geo: fallbackGeo,
                    orgId
                  });

                  if (job) {
                    router.push(`/?overlay=jobs&job_id=${job.id}`);
                    if (onSuccess) onSuccess(job.id);
                  }
                }

                setSubmitting(false);
              }
            }
          }}
        />
      )}
    </div>
  );
}
