/**
 * POST /api/instantly/dispatch-leads
 * 
 * This route is for dispatching leads to Instantly.ai outreach campaigns.
 * It is SEPARATE from job dispatch (which is handled by JobLifecycleService).
 * 
 * Use cases:
 * - Admin outreach campaigns to cold leads
 * - Bulk lead dispatch to Instantly campaigns
 * 
 * NOT for: Job work order dispatch (use POST /api/jobs or /api/jobs/[id]/dispatch)
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { instantlyClient } from '@/lib/instantlyClient';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { campaignId, targetIds } = await request.json();

    if (!campaignId || !targetIds || targetIds.length === 0) {
      return NextResponse.json(
        { error: 'Campaign ID and target IDs are required' },
        { status: 400 }
      );
    }

    console.log(`[Dispatch to Instantly] Campaign: ${campaignId}, Targets: ${targetIds.length}`);

    // Use service role to fetch campaign and targets
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('outreach_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get targets
    const { data: targets, error: targetsError } = await supabaseAdmin
      .from('outreach_targets')
      .select('*')
      .in('id', targetIds);

    if (targetsError || !targets || targets.length === 0) {
      return NextResponse.json({ error: 'No targets found' }, { status: 404 });
    }

    // Format leads for Instantly
    const leads = targets.map(target => ({
      email: target.email,
      first_name: target.full_name?.split(' ')[0] || '',
      last_name: target.full_name?.split(' ').slice(1).join(' ') || '',
      company_name: target.company || '',
      phone_number: target.phone || '',
      custom_variables: {
        trade: target.trade,
        state: target.state,
        city: target.city || '',
        website: target.website || ''
      }
    }));

    // Send leads to Instantly
    const result = await instantlyClient.addLeads(campaign.instantly_campaign_id, leads);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to add leads to Instantly', details: result.errors },
        { status: 500 }
      );
    }

    // Record dispatches in job_dispatches table
    const dispatches = targets.map(target => ({
      technician_id: target.id,
      campaign_id: campaignId,
      channel: 'instantly',
      status: 'sent',
      sent_at: new Date().toISOString()
    }));

    const { error: dispatchError } = await supabaseAdmin
      .from('job_dispatches')
      .insert(dispatches);

    if (dispatchError) {
      console.error('[Dispatch] Failed to record dispatches:', dispatchError);
    }

    // Update campaign stats
    const { error: updateError } = await supabaseAdmin
      .from('outreach_campaigns')
      .update({
        total_targets: campaign.total_targets + targets.length,
        emails_sent: campaign.emails_sent + targets.length
      })
      .eq('id', campaignId);

    if (updateError) {
      console.error('[Dispatch] Failed to update campaign stats:', updateError);
    }

    console.log(`[Dispatch] Successfully sent ${targets.length} leads to Instantly`);

    return NextResponse.json({
      success: true,
      leads_sent: targets.length,
      campaign: campaign.name
    });
  } catch (error) {
    console.error('[Dispatch to Instantly] Error:', error);
    return NextResponse.json(
      { error: 'Failed to dispatch leads' },
      { status: 500 }
    );
  }
}
