import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/retryWithBackoff';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

// Calculate confidence scores for parsed fields
function calculateConfidence(data: ParsedWorkOrderData, source: 'openai' | 'claude' | 'heuristic'): ParsedWithConfidence['confidence'] {
  const scores: Record<keyof ParsedWorkOrderData, number> = {
    job_title: data.job_title && data.job_title.length > 5 ? 0.9 : 0.3,
    description: data.description && data.description.length > 20 ? 0.9 : 0.5,
    trade_needed: ['HVAC', 'Plumbing', 'Electrical', 'Handyman', 'Facilities Tech'].includes(data.trade_needed) ? 0.95 : 0.6,
    address_text: data.address_text && typeof data.address_text === 'string' && data.address_text.match(/\d+.*[A-Z]{2}\s*\d{5}/) ? 0.95 : 0.4,
    scheduled_start_ts: data.scheduled_start_ts && data.scheduled_start_ts.length > 0 ? 0.85 : 0.3,
    urgency: data.urgency ? 0.9 : 0.5,
    duration: data.duration && typeof data.duration === 'string' && data.duration.match(/\d+/) ? 0.8 : 0.4,
    budget_min: data.budget_min > 0 ? 0.85 : 0.3,
    budget_max: data.budget_max > 0 ? 0.85 : 0.3,
    pay_rate: data.pay_rate && typeof data.pay_rate === 'string' && data.pay_rate.match(/\$\d+/) ? 0.85 : 0.4,
    contact_name: data.contact_name && data.contact_name.length > 2 ? 0.9 : 0.4,
    contact_phone: data.contact_phone && typeof data.contact_phone === 'string' && data.contact_phone.match(/\(\d{3}\)\s?\d{3}-\d{4}/) ? 0.95 : 0.4,
    contact_email: data.contact_email && typeof data.contact_email === 'string' && data.contact_email.match(/@/) ? 0.95 : 0.3,
  };

  // Source-based confidence adjustment
  const sourceMultiplier = source === 'openai' ? 1.0 : source === 'claude' ? 0.98 : 0.7;

  // Calculate adjusted scores
  const adjustedScores = Object.entries(scores).reduce((acc, [key, value]) => {
    acc[key as keyof ParsedWorkOrderData] = Math.min(1, value * sourceMultiplier);
    return acc;
  }, {} as Record<keyof ParsedWorkOrderData, number>);

  // Overall confidence is weighted average (critical fields weighted higher)
  const criticalFields = ['contact_email', 'contact_phone', 'address_text', 'scheduled_start_ts'];
  const criticalSum = criticalFields.reduce((sum, key) => sum + adjustedScores[key as keyof ParsedWorkOrderData], 0);
  const nonCriticalSum = Object.entries(adjustedScores).reduce((sum, [key, value]) => {
    return !criticalFields.includes(key) ? sum + value : sum;
  }, 0);

  const overall = (criticalSum * 1.5 + nonCriticalSum) / (criticalFields.length * 1.5 + (Object.keys(adjustedScores).length - criticalFields.length));

  return {
    overall: Math.round(overall * 100) / 100,
    fields: adjustedScores
  };
}

interface ParsedWorkOrderData {
  job_title: string;
  description: string;
  trade_needed: string;
  address_text: string;
  scheduled_start_ts: string;
  urgency: 'emergency' | 'same_day' | 'next_day' | 'within_week' | 'flexible';
  duration: string;
  budget_min: number;
  budget_max: number;
  pay_rate: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
}

interface ParsedWithConfidence {
  data: ParsedWorkOrderData;
  confidence: {
    overall: number;
    fields: Record<keyof ParsedWorkOrderData, number>;
  };
  source: 'openai' | 'claude' | 'heuristic';
}

export async function POST(request: NextRequest) {
  try {
    const { raw_text } = await request.json();

    if (!raw_text || !raw_text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Raw text is required' },
        { status: 400 }
      );
    }

    // Prefer OpenAI if configured
    console.log('[Parser] OPENAI_API_KEY configured:', !!OPENAI_API_KEY);
    if (OPENAI_API_KEY) {
      try {
        console.log('[Parser] Attempting OpenAI request...');
        const openaiRes = await fetchWithRetry(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              temperature: 0,
              messages: [
                { role: 'system', content: 'You are a work order parsing assistant with technical expertise. Output only valid JSON, no markdown. CRITICAL: Today is ' + new Date().toISOString().split('T')[0] + '. ALL dates must be TODAY or in the FUTURE. Never use past dates. If a date like "October 7" is mentioned without a year, assume it means the NEXT occurrence (future). If no date is mentioned, suggest tomorrow at 9 AM.' },
                { role: 'user', content: `Extract fields from this work order text. If unknown, infer sensible defaults.

CRITICAL DATE RULE: Today is ${new Date().toISOString().split('T')[0]}. When you see a date like "October 7" without a year:
- Check if October 7 of the current year (${new Date().getFullYear()}) has already passed
- If it has passed, use October 7 of NEXT year (${new Date().getFullYear() + 1})
- If it hasn't passed yet, use the current year
- ALL dates MUST be today or in the future, NEVER in the past

If NO date is mentioned, suggest tomorrow at 9:00 AM. Always provide a scheduled_start_ts value.

For the description field, provide a detailed TEXT analysis (as a single string) formatted with these sections:
**Symptoms:** [what was observed]
**Diagnosis:** [likely cause]
**Solution:** [recommended work]
**Safety:** [any safety concerns]

Return ONLY JSON with fields: job_title, description (string with formatted diagnosis sections), trade_needed (HVAC|Plumbing|Electrical|Handyman|Facilities Tech|Other), address_text, scheduled_start_ts (ISO format in current/future year, required), urgency (emergency|same_day|next_day|within_week|flexible), duration, budget_min (number), budget_max (number), pay_rate, contact_name, contact_phone, contact_email.\n\nRAW:\n${raw_text}` }
              ],
            }),
          },
          {
            maxRetries: 2,
            initialDelayMs: 1000,
            onRetry: (error, attempt, delay) => {
              console.log(`[OpenAI] Retry ${attempt}/2 after ${delay}ms: ${error.message}`);
            }
          }
        );
        if (openaiRes.ok) {
          console.log('[Parser] OpenAI request successful');
          const oj = await openaiRes.json();
          const content: string = oj?.choices?.[0]?.message?.content || '';
          console.log('[Parser] OpenAI response content length:', content.length);
          let parsed = null;
          let source: 'openai' | 'heuristic' = 'openai';
          if (content) { try { parsed = JSON.parse(content); } catch (e) { console.log('[Parser] JSON parse error:', e); } }
          if (!parsed) {
            console.log('[Parser] Falling back to heuristic parsing');
            parsed = basicHeuristicParse(raw_text);
            source = 'heuristic';
          } else {
            console.log('[Parser] Successfully parsed OpenAI response');
          }

          // Convert description object to string if needed
          if (parsed && typeof parsed.description === 'object' && parsed.description !== null) {
            const desc = parsed.description;
            parsed.description = `**Symptoms:** ${desc.symptoms_observed || 'Not specified'}\n**Diagnosis:** ${desc.likely_cause || 'Not specified'}\n**Solution:** ${desc.recommended_solution || 'Not specified'}\n**Safety:** ${desc.safety_concerns || 'None'}`;
          }

          const confidence = calculateConfidence(parsed, source);
          console.log('[Parser] Returning response with source:', source);
          return NextResponse.json({
            success: true,
            data: parsed,
            confidence: confidence.overall,
            fieldConfidence: confidence.fields,
            source
          }, { status: 200 });
        } else {
          console.log('[Parser] OpenAI API request failed:', openaiRes.status, openaiRes.statusText);
          const errorBody = await openaiRes.text();
          console.log('[Parser] OpenAI error response:', errorBody);
        }
      } catch (err) {
        console.log('[Parser] OpenAI API error:', err);
      }
      // Fall through to Claude or heuristic
    }

    if (!CLAUDE_API_KEY) {
      // Fallback heuristic parsing when neither OpenAI nor Claude is configured
      const parsed = basicHeuristicParse(raw_text);
      const confidence = calculateConfidence(parsed, 'heuristic');
      return NextResponse.json({
        success: true,
        data: parsed,
        confidence: confidence.overall,
        fieldConfidence: confidence.fields,
        source: 'heuristic'
      }, { status: 200 });
    }

    // Call Claude API to parse the work order with retry logic
    const response = await fetchWithRetry(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are a work order parsing assistant. Extract the following fields from the raw work order text and return ONLY a valid JSON object (no markdown, no explanation). If a field is not found, use a sensible default.

IMPORTANT:
- When parsing dates, use the CURRENT year (${new Date().getFullYear()}) or future years only. Never use dates from past years like 2023 or 2024.
- If NO date is mentioned in the text, suggest tomorrow at 9:00 AM as a sensible default.
- Always provide a scheduled_start_ts value, never leave it empty.

Raw work order text:
${raw_text}

Return JSON with these exact fields:
{
  "job_title": "string (concise title, max 100 chars)",
  "description": "string (detailed text analysis formatted with sections: **Symptoms:** [observed], **Diagnosis:** [likely cause], **Solution:** [recommended work], **Safety:** [concerns])",
  "trade_needed": "string (one of: HVAC, Plumbing, Electrical, Handyman, Facilities Tech, Other)",
  "address_text": "string (full address)",
  "scheduled_start_ts": "string (ISO 8601 datetime in current/future year, e.g. ${new Date().getFullYear()}-10-15T14:00:00)",
  "urgency": "string (one of: emergency, same_day, next_day, within_week, flexible)",
  "duration": "string (estimated time, e.g. '2-3 hours')",
  "budget_min": number (in dollars, minimum),
  "budget_max": number (in dollars, maximum),
  "pay_rate": "string (e.g. '$75/hr' or '$500 flat')",
  "contact_name": "string (requester name)",
  "contact_phone": "string (phone number)",
  "contact_email": "string (email address)"
}`,
          },
        ],
      }),
    },
    {
      maxRetries: 2,
      initialDelayMs: 1000,
      onRetry: (error, attempt, delay) => {
        console.log(`[Claude] Retry ${attempt}/2 after ${delay}ms: ${error.message}`);
      }
    }
  );

    if (!response.ok) {
      const error = await response.json();
      console.error('Claude API error:', error);
      return NextResponse.json(
        { success: false, error: 'Claude API call failed' },
        { status: 500 }
      );
    }

    const result = await response.json();
    const content = result.content[0]?.text;

    // Attempt to parse; if invalid JSON, fallback to heuristic
    let parsed: ParsedWorkOrderData | null = null;
    let source: 'claude' | 'heuristic' = 'claude';
    if (content) {
      try { parsed = JSON.parse(content); } catch {}
    }
    if (!parsed) {
      parsed = basicHeuristicParse(raw_text);
      source = 'heuristic';
    }

    const confidence = calculateConfidence(parsed, source);

    return NextResponse.json({
      success: true,
      data: parsed,
      confidence: confidence.overall,
      fieldConfidence: confidence.fields,
      source
    }, { status: 200 });
  } catch (error) {
    console.error('Parse API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

function basicHeuristicParse(text: string): ParsedWorkOrderData {
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
  const job_title = clean.slice(0, 100).replace(/\s+/g, ' ').trim() || 'Work Order';
  const address_text = (clean.match(/\d+\s+[^,\n]+,?\s*[^,\n]+,?\s*[A-Z]{2}\s*\d{5}?/) || [])[0] || '';

  // Enhanced date/time parsing - support multiple formats
  const toLocalInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  let scheduled_start_ts = '';

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
  }

  // If no date found, provide a default based on urgency
  if (!scheduled_start_ts) {
    const now = new Date();
    const defaultDate = new Date(now);
    defaultDate.setHours(9, 0, 0, 0); // Default to 9 AM

    // Default to tomorrow at 9 AM if no date found
    defaultDate.setDate(now.getDate() + 1);
    scheduled_start_ts = toLocalInput(defaultDate);
  }

  let urgency: ParsedWorkOrderData['urgency'] = 'within_week';
  if (/emergency|critical|asap|immediately/i.test(clean)) urgency = 'emergency';
  else if (/today|same\s*day/i.test(clean)) urgency = 'same_day';
  else if (/tomorrow|next\s*day/i.test(clean)) urgency = 'next_day';
  else if (/week/i.test(clean)) urgency = 'within_week';
  const durRange = clean.match(/(\d+)\s*[-–]\s*(\d+)\s*(hours|hrs|h)\b/i);
  const durSingle = clean.match(/\b(\d+)\s*(hours|hrs|h)\b/i);
  const duration = durRange ? `${durRange[1]}-${durRange[2]} hours` : (durSingle ? `${durSingle[1]} hours` : '');
  const dollarMatches = Array.from(clean.matchAll(/\$\s*([0-9][0-9,]*(?:\.\d{2})?)/g)).map(m => Number(String(m[1]).replace(/,/g, '')));
  const commaMatches = Array.from(clean.matchAll(/([0-9]{1,3}(?:,[0-9]{3})+(?:\.\d{2})?)/g)).map(m => Number(String(m[1]).replace(/,/g, '')));
  const moneyMatches = [...dollarMatches, ...commaMatches].filter(n => Number.isFinite(n));
  const budget_min = moneyMatches.length ? Math.min(...moneyMatches) : 0;
  const budget_max = moneyMatches.length ? Math.max(...moneyMatches) : 0;
  const pay_rate = (clean.match(/\$\s*[0-9][0-9,]*\s*\/?\s*(hr|hour|flat)/i) || [])[0] || '';
  const contact_name = (clean.match(/(?:Contact|Attn|Attention)[:\s]+([A-Za-z ]{3,40})/i) || [])[1] || '';
  return { job_title, description: text, trade_needed, address_text, scheduled_start_ts, urgency, duration, budget_min, budget_max, pay_rate, contact_name, contact_phone: phone, contact_email: email };
}
