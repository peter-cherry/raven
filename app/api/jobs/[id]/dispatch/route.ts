import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { rankContractors } from '@/lib/contractor-scoring';
import { findColdLeads, instantlyV2Client, SuperSearchLead } from '@/lib/instantly/supersearch';
import { isMailtrapEnabled, sendViaMailtrap, buildJobDispatchEmail } from '@/lib/mailtrap';
import { runLeadPipeline, PipelineResult } from '@/lib/lead-pipeline';

/**
 * Dual-Channel Dispatch System
 *
 * WARM: Registered technicians (technicians table) → SendGrid
 * COLD: Dynamic leads via Instantly SuperSearch → Instantly campaigns
 *
 * Flow:
 * 1. Query warm technicians from DB (signed_up = true)
 * 2. Search cold leads via SuperSearch (based on job trade + location)
 * 3. Save cold leads to cold_leads table for metrics
 * 4. Send warm emails via SendGrid
 * 5. Add cold leads to Instantly campaign
 * 6. Track all in work_order_recipients
 */

// Helper to format urgency for display
function formatUrgency(urgency: string): string {
  const urgencyMap: Record<string, string> = {
    'emergency': 'Emergency',
    'same_day': 'Same Day',
    'next_day': 'Next Day',
    'within_week': 'Within Week',
    'flexible': 'Flexible'
  };
  return urgencyMap[urgency] || urgency || 'Flexible';
}

// Helper to format budget range
function formatBudgetRange(min: number | null, max: number | null): string {
  if (min && max) {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  } else if (min) {
    return `From $${min.toLocaleString()}`;
  } else if (max) {
    return `Up to $${max.toLocaleString()}`;
  }
  return 'Competitive Rate';
}

// Helper to format date for display
function formatScheduledDate(date: string | null): string {
  if (!date) return 'Flexible';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// SendGrid email sending for warm leads
async function sendWarmEmails(
  technicians: any[],
  job: any,
  outreachId: string,
  recipientIdMap: Map<string, string> // Map of technician ID to recipient ID
): Promise<{ success: boolean; sent: number; errors?: any[] }> {
  try {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'jobs@raven-search.com';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ravensearch.ai';

    // Company info for CAN-SPAM compliance
    const companyName = 'Kobayat INC';
    const companyAddress = '9672 VIA TORINO, Burbank, CA';

    // ============================================
    // MAILTRAP MODE (Development/Testing)
    // ============================================
    if (isMailtrapEnabled()) {
      console.log(`[Mailtrap] Sending ${technicians.length} warm emails for job ${job.id} (sequential with 1.5s delay)`);

      // Send emails sequentially with delay to avoid Mailtrap rate limit (1 email/sec on free tier)
      const results: { status: 'fulfilled' | 'rejected'; value?: string; reason?: any }[] = [];

      for (let i = 0; i < technicians.length; i++) {
        const tech = technicians[i];

        // Wait 1.5 seconds between emails (except for first one)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        try {
          const recipientId = recipientIdMap.get(tech.id) || '';
          const techName = tech.full_name || tech.first_name || 'Contractor';

          // Build response URL with recipient tracking
          const responseUrl = `${appUrl}/jobs/${job.id}/respond?tech=${tech.id}&r=${recipientId}`;
          const unsubscribeUrl = `${appUrl}/api/unsubscribe?email=${encodeURIComponent(tech.email)}&type=warm`;

          // Build email HTML using same template as SendGrid
          const html = buildJobDispatchEmail({
            technician_name: techName,
            job_title: job.job_title || `${job.trade_needed} Job`,
            trade_needed: job.trade_needed || 'General',
            location: `${job.city || ''}, ${job.state || ''}`.trim() || 'Location TBD',
            urgency: formatUrgency(job.urgency),
            scheduled_date: formatScheduledDate(job.scheduled_at),
            duration: job.duration || 'TBD',
            budget_range: formatBudgetRange(job.budget_min, job.budget_max),
            description: job.description ? job.description.substring(0, 200) : 'Details provided upon confirmation.',
            response_url: responseUrl,
            company_name: companyName,
            company_address: companyAddress,
            unsubscribe_url: unsubscribeUrl,
          });

          const result = await sendViaMailtrap({
            to: tech.email,
            toName: techName,
            from: fromEmail,
            fromName: 'Ravensearch Jobs',
            subject: `New ${job.trade_needed} Job in ${job.city || job.state || 'your area'} - ${formatUrgency(job.urgency)}`,
            html,
            text: `Hi ${techName}, we have a ${job.trade_needed} job opportunity for you. Visit ${responseUrl} to respond.`,
          });

          if (!result.success) {
            throw new Error(result.error || 'Mailtrap send failed');
          }

          console.log(`[Mailtrap] ✓ Sent email ${i + 1}/${technicians.length} to ${tech.email}`);
          results.push({ status: 'fulfilled', value: tech.email });
        } catch (error) {
          console.error(`[Mailtrap] ✗ Failed email ${i + 1}/${technicians.length} to ${tech.email}:`, error);
          results.push({ status: 'rejected', reason: error });
        }
      }

      const sent = results.filter(r => r.status === 'fulfilled').length;
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => r.reason);

      console.log(`[Mailtrap] Complete: ${sent}/${technicians.length} emails sent`);
      return { success: true, sent, errors: errors.length > 0 ? errors : undefined };
    }

    // ============================================
    // SENDGRID MODE (Production)
    // ============================================
    const sendgridApiKey = process.env.SENDGRID_API_KEY;

    if (!sendgridApiKey) {
      console.log('[SendGrid] No API key configured - using test mode');
      // Test mode: simulate sending
      console.log(`[SendGrid] Would send ${technicians.length} warm emails for job ${job.id}`);
      return { success: true, sent: technicians.length };
    }

    console.log(`[SendGrid] Sending ${technicians.length} warm emails for job ${job.id}`);

    const results = await Promise.allSettled(
      technicians.map(async (tech) => {
        const recipientId = recipientIdMap.get(tech.id) || '';
        const techName = tech.full_name || tech.first_name || 'Contractor';

        // Build response URL with recipient tracking
        const responseUrl = `${appUrl}/jobs/${job.id}/respond?tech=${tech.id}&r=${recipientId}`;
        const unsubscribeUrl = `${appUrl}/api/unsubscribe?email=${encodeURIComponent(tech.email)}&type=warm`;

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sendgridApiKey}`,
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: tech.email, name: techName }],
              dynamic_template_data: {
                // Recipient info
                technician_name: techName,
                first_name: tech.first_name || techName.split(' ')[0],

                // Job details (structured summary)
                job_title: job.job_title || `${job.trade_needed} Job`,
                trade_needed: job.trade_needed || 'General',
                location: `${job.city || ''}, ${job.state || ''}`.trim() || 'Location TBD',
                urgency: formatUrgency(job.urgency),
                scheduled_date: formatScheduledDate(job.scheduled_at),
                duration: job.duration || 'TBD',
                budget_range: formatBudgetRange(job.budget_min, job.budget_max),
                description: job.description ? job.description.substring(0, 200) : 'Details provided upon confirmation.',

                // Response URL (warm only)
                response_url: responseUrl,

                // CAN-SPAM compliance
                company_name: companyName,
                company_address: companyAddress,
                unsubscribe_url: unsubscribeUrl,
              },
            }],
            from: { email: fromEmail, name: 'Ravensearch Jobs' },
            reply_to: { email: fromEmail, name: 'Ravensearch Jobs' },
            template_id: process.env.SENDGRID_JOB_DISPATCH_TEMPLATE_ID || 'd-placeholder',
            tracking_settings: {
              click_tracking: { enable: true },
              open_tracking: { enable: true },
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[SendGrid] Error for ${tech.email}:`, response.status, errorText);
          throw new Error(`SendGrid error: ${response.status}`);
        }

        return tech.email;
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason);

    return { success: true, sent, errors: errors.length > 0 ? errors : undefined };
  } catch (error) {
    console.error('[SendGrid] Error sending warm emails:', error);
    return { success: false, sent: 0, errors: [error] };
  }
}

// Send cold emails via SendGrid (same channel as warm, for pipeline-sourced leads)
async function sendColdEmailsViaSendGrid(
  leads: SuperSearchLead[],
  job: any,
  outreachId: string,
  recipientIdMap: Map<string, string>
): Promise<{ success: boolean; sent: number; errors?: any[] }> {
  try {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'jobs@raven-search.com';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ravensearch.ai';

    // Company info for CAN-SPAM compliance
    const companyName = 'Kobayat INC';
    const companyAddress = '9672 VIA TORINO, Burbank, CA';

    // ============================================
    // MAILTRAP MODE (Development/Testing)
    // ============================================
    if (isMailtrapEnabled()) {
      console.log(`[Mailtrap] Sending ${leads.length} cold emails for job ${job.id} (sequential with 1.5s delay)`);

      const results: { status: 'fulfilled' | 'rejected'; value?: string; reason?: any }[] = [];

      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];

        // Wait 1.5 seconds between emails
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        try {
          const recipientId = recipientIdMap.get(lead.id || lead.email) || '';
          const leadName = lead.full_name || lead.first_name || lead.company_name || 'Contractor';

          // Build response URL with recipient tracking
          const responseUrl = `${appUrl}/jobs/${job.id}/respond?lead=${encodeURIComponent(lead.email)}&r=${recipientId}`;
          const unsubscribeUrl = `${appUrl}/api/unsubscribe?email=${encodeURIComponent(lead.email)}&type=cold`;

          const html = buildJobDispatchEmail({
            technician_name: leadName,
            job_title: job.job_title || `${job.trade_needed} Job`,
            trade_needed: job.trade_needed || 'General',
            location: `${job.city || ''}, ${job.state || ''}`.trim() || 'Location TBD',
            urgency: formatUrgency(job.urgency),
            scheduled_date: formatScheduledDate(job.scheduled_at),
            duration: job.duration || 'TBD',
            budget_range: formatBudgetRange(job.budget_min, job.budget_max),
            description: job.description ? job.description.substring(0, 200) : 'Details provided upon confirmation.',
            response_url: responseUrl,
            company_name: companyName,
            company_address: companyAddress,
            unsubscribe_url: unsubscribeUrl,
          });

          const result = await sendViaMailtrap({
            to: lead.email,
            toName: leadName,
            from: fromEmail,
            fromName: 'Ravensearch Jobs',
            subject: `New ${job.trade_needed} Job in ${job.city || job.state || 'your area'} - ${formatUrgency(job.urgency)}`,
            html,
            text: `Hi ${leadName}, we have a ${job.trade_needed} job opportunity for you. Visit ${responseUrl} to respond.`,
          });

          if (!result.success) {
            throw new Error(result.error || 'Mailtrap send failed');
          }

          console.log(`[Mailtrap] ✓ Sent cold email ${i + 1}/${leads.length} to ${lead.email}`);
          results.push({ status: 'fulfilled', value: lead.email });
        } catch (error) {
          console.error(`[Mailtrap] ✗ Failed cold email ${i + 1}/${leads.length} to ${lead.email}:`, error);
          results.push({ status: 'rejected', reason: error });
        }
      }

      const sent = results.filter(r => r.status === 'fulfilled').length;
      const errors = results.filter(r => r.status === 'rejected').map(r => r.reason);

      console.log(`[Mailtrap] Complete: ${sent}/${leads.length} cold emails sent`);
      return { success: true, sent, errors: errors.length > 0 ? errors : undefined };
    }

    // ============================================
    // SENDGRID MODE (Production)
    // ============================================
    const sendgridApiKey = process.env.SENDGRID_API_KEY;

    if (!sendgridApiKey) {
      console.log('[SendGrid] No API key configured - using test mode');
      console.log(`[SendGrid] Would send ${leads.length} cold emails for job ${job.id}`);
      return { success: true, sent: leads.length };
    }

    console.log(`[SendGrid] Sending ${leads.length} cold emails for job ${job.id}`);

    const results = await Promise.allSettled(
      leads.map(async (lead) => {
        const recipientId = recipientIdMap.get(lead.id || lead.email) || '';
        const leadName = lead.full_name || lead.first_name || lead.company_name || 'Contractor';

        const responseUrl = `${appUrl}/jobs/${job.id}/respond?lead=${encodeURIComponent(lead.email)}&r=${recipientId}`;
        const unsubscribeUrl = `${appUrl}/api/unsubscribe?email=${encodeURIComponent(lead.email)}&type=cold`;

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sendgridApiKey}`,
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: lead.email, name: leadName }],
              dynamic_template_data: {
                technician_name: leadName,
                first_name: lead.first_name || leadName.split(' ')[0],
                job_title: job.job_title || `${job.trade_needed} Job`,
                trade_needed: job.trade_needed || 'General',
                location: `${job.city || ''}, ${job.state || ''}`.trim() || 'Location TBD',
                urgency: formatUrgency(job.urgency),
                scheduled_date: formatScheduledDate(job.scheduled_at),
                duration: job.duration || 'TBD',
                budget_range: formatBudgetRange(job.budget_min, job.budget_max),
                description: job.description ? job.description.substring(0, 200) : 'Details provided upon confirmation.',
                response_url: responseUrl,
                company_name: companyName,
                company_address: companyAddress,
                unsubscribe_url: unsubscribeUrl,
              },
            }],
            from: { email: fromEmail, name: 'Ravensearch Jobs' },
            reply_to: { email: fromEmail, name: 'Ravensearch Jobs' },
            template_id: process.env.SENDGRID_JOB_DISPATCH_TEMPLATE_ID || 'd-placeholder',
            tracking_settings: {
              click_tracking: { enable: true },
              open_tracking: { enable: true },
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[SendGrid] Error for cold lead ${lead.email}:`, response.status, errorText);
          throw new Error(`SendGrid error: ${response.status}`);
        }

        return lead.email;
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason);

    return { success: true, sent, errors: errors.length > 0 ? errors : undefined };
  } catch (error) {
    console.error('[SendGrid] Error sending cold emails:', error);
    return { success: false, sent: 0, errors: [error] };
  }
}

// Send cold emails via Instantly campaign (legacy - keeping for reference)
async function sendColdEmails(
  leads: SuperSearchLead[],
  job: any,
  outreachId: string
): Promise<{ success: boolean; sent: number; errors?: any[] }> {
  try {
    const campaignId = process.env.INSTANTLY_CAMPAIGN_ID_COLD;

    if (!campaignId) {
      console.log('[Instantly] No campaign ID configured - using test mode');
      console.log(`[Instantly] Would add ${leads.length} cold leads for job ${job.id}`);
      return { success: true, sent: leads.length };
    }

    console.log(`[Instantly] Adding ${leads.length} cold leads to campaign ${campaignId}`);

    const result = await instantlyV2Client.addLeadsToCampaign(campaignId, leads, {
      job_id: job.id,
      job_trade: job.trade_needed,
      job_location: `${job.city || ''}, ${job.state || ''}`.trim(),
      outreach_id: outreachId,
    });

    // Map 'added' to 'sent' for consistent return type
    return {
      success: result.success,
      sent: result.added || 0,
      errors: result.errors
    };
  } catch (error) {
    console.error('[Instantly] Error sending cold emails:', error);
    return { success: false, sent: 0, errors: [error] };
  }
}

// Save cold leads to database for metrics tracking
async function saveColdLeads(
  supabase: any,
  leads: SuperSearchLead[],
  job: any,
  query: string
): Promise<string[]> {
  const savedIds: string[] = [];

  for (const lead of leads) {
    try {
      // Upsert to handle duplicates gracefully
      const { data, error } = await supabase
        .from('cold_leads')
        .upsert({
          email: lead.email.toLowerCase(),
          full_name: lead.full_name,
          first_name: lead.first_name,
          last_name: lead.last_name,
          company_name: lead.company_name,
          job_title: lead.job_title,
          phone: lead.phone,
          linkedin_url: lead.linkedin_url,
          website: lead.website,
          city: lead.city || job.city,
          state: lead.state || job.state,
          trade_type: job.trade_needed,
          supersearch_query: query,
          email_verified: lead.email_verified || false,
          last_dispatched_at: new Date().toISOString(),
          dispatch_count: 1, // Will be incremented on conflict
        }, {
          onConflict: 'email',
          ignoreDuplicates: false,
        })
        .select('id')
        .single();

      if (data?.id) {
        savedIds.push(data.id);

        // Update dispatch count for existing leads
        await supabase
          .from('cold_leads')
          .update({
            last_dispatched_at: new Date().toISOString(),
            dispatch_count: supabase.rpc('increment', { x: 1 }),
          })
          .eq('email', lead.email.toLowerCase());
      }
    } catch (err) {
      console.error('[saveColdLeads] Error saving lead:', lead.email, err);
    }
  }

  return savedIds;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Development mode bypass - use service role key
    const isDevelopment = process.env.NODE_ENV === 'development';
    let supabase: any;
    let userId: string;

    if (isDevelopment) {
      console.log('[Dispatch] Dev mode: using service role key');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
      supabase = createClient(url, serviceKey);
      userId = '00000000-0000-0000-0000-000000000001'; // Fake dev user ID
    } else {
      supabase = createRouteHandlerClient({ cookies });

      // Get authenticated user (only in production)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if dispatch already exists
    const { data: existingOutreach } = await supabase
      .from('work_order_outreach')
      .select('id')
      .eq('job_id', jobId)
      .single();

    if (existingOutreach) {
      return NextResponse.json({
        error: 'Dispatch already initiated for this job',
        outreachId: existingOutreach.id
      }, { status: 400 });
    }

    // ============================================
    // PHASE 1: WARM TECHNICIANS (from DB)
    // ============================================
    console.log('[Dispatch] Phase 1: Finding warm technicians');

    // Public Pool org ID - contains self-registered independent contractors
    const PUBLIC_POOL_ORG_ID = '00000000-0000-0000-0000-000000000001';

    const { data: technicians, error: techError } = await supabase
      .from('technicians')
      .select('*')
      .in('org_id', [job.org_id, PUBLIC_POOL_ORG_ID]) // Org-specific + Public Pool
      .eq('trade_needed', job.trade_needed)
      .eq('is_available', true)
      .eq('signed_up', true) // Only registered technicians
      .is('unsubscribed_at', null); // Exclude unsubscribed technicians

    if (techError) {
      console.error('[Dispatch] Error fetching technicians:', techError);
    }

    // Filter by distance (50 mile radius)
    const MAX_DISTANCE_MILES = 50;
    const warmTechnicians = (technicians || []).filter((tech: any) => {
      if (!tech.lat || !tech.lng || !job.lat || !job.lng) return false;

      const R = 3959;
      const dLat = (tech.lat - job.lat) * Math.PI / 180;
      const dLng = (tech.lng - job.lng) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(job.lat * Math.PI / 180) * Math.cos(tech.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return distance <= MAX_DISTANCE_MILES;
    });

    console.log(`[Dispatch] Found ${warmTechnicians.length} warm technicians within ${MAX_DISTANCE_MILES} miles`);

    // Rank warm technicians by composite score
    const jobDate = job.scheduled_date ? new Date(job.scheduled_date) : undefined;
    const rankedWarm = rankContractors(warmTechnicians, jobDate);

    // Create service client (needed for both warm and cold paths)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
      console.error('[Dispatch] SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // ============================================
    // PHASE 2: COLD LEADS (only if no warm technicians)
    // ============================================
    let coldLeads: SuperSearchLead[] = [];
    let coldLeadIds: string[] = [];
    let pipelineStats = {
      ran: false,
      selected: 0,
      verified: 0,
      moved: 0,
      creditsUsed: 0
    };

    if (rankedWarm.length === 0) {
      console.log('[Dispatch] Phase 2: No warm technicians found - checking pre-qualified cold_leads');

      // STEP 2A: First try pre-qualified cold leads from database
      const { data: coldLeadRecords, error: coldError } = await supabase
        .from('cold_leads')
        .select('*')
        .eq('trade_type', job.trade_needed)
        .eq('state', job.state)
        .is('unsubscribed_at', null)  // Exclude unsubscribed
        .is('last_dispatched_at', null)  // Only un-contacted leads
        .limit(50);

      if (coldError) {
        console.error('[Dispatch] Error querying cold_leads:', coldError);
      }

      if (coldLeadRecords && coldLeadRecords.length > 0) {
        // Use pre-qualified leads from database
        console.log(`[Dispatch] Found ${coldLeadRecords.length} pre-qualified cold leads`);

        coldLeads = coldLeadRecords.map((lead: any) => ({
          id: lead.id,
          email: lead.email,
          first_name: lead.first_name,
          last_name: lead.last_name,
          full_name: lead.full_name,
          company_name: lead.company_name,
          job_title: lead.job_title,
          phone: lead.phone,
          linkedin_url: lead.linkedin_url,
          website: lead.website,
          city: lead.city,
          state: lead.state,
          email_verified: lead.email_verified,
        }));

        coldLeadIds = coldLeads.map((lead: any) => lead.id);

        // Mark these leads as dispatched
        await supabase
          .from('cold_leads')
          .update({ last_dispatched_at: new Date().toISOString() })
          .in('id', coldLeadIds);

      } else {
        // No pre-qualified cold leads available
        // Run the automated lead pipeline to source new leads
        console.log('[Dispatch] No pre-qualified cold leads - running automated lead pipeline');

        const pipelineResult: PipelineResult = await runLeadPipeline(
          {
            id: job.id,
            city: job.city || '',
            state: job.state || '',
            trade_needed: job.trade_needed || '',
            lat: job.lat,
            lng: job.lng
          },
          {
            selectLimit: 20,  // AI select up to 20 contractors
            verifyLimit: 10,  // Verify up to 10 emails
            minConfidence: 70, // Minimum Hunter.io confidence
            skipIfColdExists: false  // We already checked, run anyway
          }
        );

        // Track pipeline stats
        pipelineStats = {
          ran: pipelineResult.pipelineRan,
          selected: pipelineResult.selected,
          verified: pipelineResult.verified,
          moved: pipelineResult.movedToCold,
          creditsUsed: pipelineResult.hunterCreditsUsed || 0
        };

        if (pipelineResult.success && pipelineResult.coldLeadIds.length > 0) {
          console.log(`[Dispatch] Pipeline created ${pipelineResult.coldLeadIds.length} new cold leads`);

          // Fetch the fresh cold leads we just created
          const { data: freshColdLeads, error: freshError } = await supabase
            .from('cold_leads')
            .select('*')
            .in('id', pipelineResult.coldLeadIds);

          if (!freshError && freshColdLeads && freshColdLeads.length > 0) {
            coldLeads = freshColdLeads.map((lead: any) => ({
              id: lead.id,
              email: lead.email,
              first_name: lead.first_name,
              last_name: lead.last_name,
              full_name: lead.full_name,
              company_name: lead.company_name,
              job_title: lead.job_title,
              phone: lead.phone,
              linkedin_url: lead.linkedin_url,
              website: lead.website,
              city: lead.city,
              state: lead.state,
              email_verified: lead.email_verified,
            }));

            coldLeadIds = coldLeads.map((lead: any) => lead.id);

            // Mark these leads as dispatched
            await supabase
              .from('cold_leads')
              .update({ last_dispatched_at: new Date().toISOString() })
              .in('id', coldLeadIds);

            console.log(`[Dispatch] Loaded ${coldLeads.length} fresh cold leads from pipeline`);
          }
        } else if (pipelineResult.error) {
          console.warn(`[Dispatch] Pipeline error: ${pipelineResult.error}`);
        } else if (pipelineResult.skippedReason) {
          console.log(`[Dispatch] Pipeline skipped: ${pipelineResult.skippedReason}`);
        } else {
          console.log('[Dispatch] Pipeline ran but produced no cold leads');
        }
      }
    } else {
      console.log(`[Dispatch] Phase 2: Skipping cold search - ${rankedWarm.length} warm technicians found`);
    }

    // ============================================
    // PHASE 3: CREATE OUTREACH RECORD
    // ============================================
    const totalRecipients = rankedWarm.length + coldLeads.length;

    if (totalRecipients === 0) {
      return NextResponse.json({
        error: `No ${job.trade_needed} technicians or leads available in ${job.city || job.state || 'this area'}`,
        count: 0
      }, { status: 404 });
    }

    const { data: outreach, error: outreachError } = await supabase
      .from('work_order_outreach')
      .insert({
        job_id: jobId,
        // In development, don't set initiated_by since fake user doesn't exist in auth.users
        ...(isDevelopment ? {} : { initiated_by: userId }),
        total_recipients: totalRecipients,
        status: 'pending',
        warm_sent: 0,
        cold_sent: 0,
        warm_opened: 0,
        cold_opened: 0,
        warm_replied: 0,
        cold_replied: 0,
        warm_qualified: 0,
        cold_qualified: 0,
        // Pipeline tracking
        pipeline_ran: pipelineStats.ran,
        pipeline_selected: pipelineStats.selected,
        pipeline_verified: pipelineStats.verified,
        pipeline_moved: pipelineStats.moved,
        pipeline_credits_used: pipelineStats.creditsUsed
      })
      .select()
      .single();

    if (outreachError || !outreach) {
      console.error('[Dispatch] Error creating outreach:', outreachError);
      return NextResponse.json({ error: 'Failed to create outreach record' }, { status: 500 });
    }

    // ============================================
    // PHASE 4: CREATE RECIPIENTS & BUILD ID MAP
    // ============================================

    // Build recipient ID map for tracking response URLs
    const recipientIdMap = new Map<string, string>();

    // Warm recipients (from technicians table)
    const warmRecipients = rankedWarm.map(tech => ({
      outreach_id: outreach.id,
      technician_id: tech.id,
      lead_source: 'warm',
      dispatch_method: 'sendgrid_warm',
      email_sent: false,
    }));

    // Cold recipients (from SuperSearch)
    const coldRecipients = coldLeadIds.map((coldLeadId) => ({
      outreach_id: outreach.id,
      technician_id: null,
      cold_lead_id: coldLeadId,
      lead_source: 'cold_supersearch',
      dispatch_method: 'instantly_cold',
      email_sent: false,
    }));

    // Insert warm recipients first and capture IDs
    if (warmRecipients.length > 0) {
      const { data: insertedWarm, error: warmError } = await serviceClient
        .from('work_order_recipients')
        .insert(warmRecipients)
        .select('id, technician_id');

      if (warmError) {
        console.error('[Dispatch] Error creating warm recipients:', warmError);
      } else if (insertedWarm) {
        // Build map of technician_id -> recipient_id for response URL tracking
        insertedWarm.forEach((recipient: { id: string; technician_id: string }) => {
          if (recipient.technician_id) {
            recipientIdMap.set(recipient.technician_id, recipient.id);
          }
        });
        console.log(`[Dispatch] Created ${insertedWarm.length} warm recipient records`);
      }
    }

    // Insert cold recipients and capture IDs for SendGrid tracking
    if (coldRecipients.length > 0) {
      const { data: insertedCold, error: coldError } = await serviceClient
        .from('work_order_recipients')
        .insert(coldRecipients)
        .select('id, cold_lead_id');

      if (coldError) {
        console.error('[Dispatch] Error creating cold recipients:', coldError);
      } else if (insertedCold) {
        // Build map of cold_lead_id -> recipient_id for SendGrid tracking
        insertedCold.forEach((recipient: { id: string; cold_lead_id: string }) => {
          if (recipient.cold_lead_id) {
            recipientIdMap.set(recipient.cold_lead_id, recipient.id);
          }
        });
        // Also map by email for lookup
        coldLeads.forEach((lead: any) => {
          const matchingRecipient = insertedCold.find((r: any) => r.cold_lead_id === lead.id);
          if (matchingRecipient) {
            recipientIdMap.set(lead.email, matchingRecipient.id);
          }
        });
        console.log(`[Dispatch] Created ${insertedCold.length} cold recipient records`);
      }
    }

    // Initialize SLA timers
    try {
      await supabase.rpc('initialize_sla_timers', { p_job_id: jobId });
    } catch (slaError) {
      console.error('[Dispatch] SLA timer initialization failed:', slaError);
    }

    // ============================================
    // PHASE 5: SEND EMAILS IMMEDIATELY VIA SENDGRID
    // ============================================
    console.log('[Dispatch] Phase 5: Sending emails immediately via SendGrid');

    const [warmResult, coldResult] = await Promise.allSettled([
      rankedWarm.length > 0
        ? sendWarmEmails(rankedWarm, job, outreach.id, recipientIdMap)
        : Promise.resolve({ success: true, sent: 0 }),

      coldLeads.length > 0
        ? sendColdEmailsViaSendGrid(coldLeads, job, outreach.id, recipientIdMap)
        : Promise.resolve({ success: true, sent: 0 }),
    ]);

    const warmSent = warmResult.status === 'fulfilled' ? warmResult.value.sent : 0;
    const coldSent = coldResult.status === 'fulfilled' ? coldResult.value.sent : 0;

    // Update outreach stats
    await supabase
      .from('work_order_outreach')
      .update({
        status: 'active',
        warm_sent: warmSent,
        cold_sent: coldSent,
      })
      .eq('id', outreach.id);

    // Update job status to dispatched
    await supabase
      .from('jobs')
      .update({ status: 'dispatched' })
      .eq('id', jobId);

    console.log(`[Dispatch] Complete: ${warmSent} warm + ${coldSent} cold emails sent`);

    return NextResponse.json({
      success: true,
      outreachId: outreach.id,
      jobId: jobId,
      totalRecipients,
      warmCount: rankedWarm.length,
      coldCount: coldLeads.length,
      warmSent,
      coldSent,
      trade: job.trade_needed,
      location: `${job.city || ''}, ${job.state || ''}`.trim(),
      message: warmSent > 0 && coldSent === 0
        ? `Dispatched to ${warmSent} registered ${job.trade_needed} contractors`
        : coldSent > 0 && warmSent === 0
          ? `Dispatched to ${coldSent} cold leads (no registered contractors in area)`
          : warmSent > 0 && coldSent > 0
            ? `Dispatched to ${warmSent} registered + ${coldSent} cold leads`
            : `No contractors found in ${job.city || job.state || 'this area'}`,
      topWarm: rankedWarm.slice(0, 3).map(c => ({
        id: c.id,
        name: c.full_name,
        score: c.compositeScore,
      })),
      coldLeadsSample: coldLeads.slice(0, 3).map(l => ({
        email: l.email,
        company: l.company_name,
        verified: l.email_verified,
      })),
      // Pipeline stats (if ran)
      pipeline: pipelineStats.ran ? {
        ran: true,
        selected: pipelineStats.selected,
        verified: pipelineStats.verified,
        moved: pipelineStats.moved,
        creditsUsed: pipelineStats.creditsUsed
      } : { ran: false }
    });

  } catch (error: any) {
    console.error('[Dispatch] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
