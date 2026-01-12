import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Instantly.ai Webhook Handler
 *
 * Receives real-time events from Instantly when:
 * - Emails are sent
 * - Emails are opened
 * - Emails are clicked
 * - Replies are received
 * - Leads bounce
 *
 * Configure webhook in Instantly dashboard:
 * https://app.instantly.ai/app/settings/integrations
 * Webhook URL: https://your-domain.com/api/webhooks/instantly
 */

export async function POST(request: Request) {
  try {
    const event = await request.json();

    console.log('[Instantly Webhook] Event received:', event.type, event);

    // Use service role to update database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Find campaign by Instantly campaign ID
    const { data: campaign, error: campaignError } = await supabase
      .from('outreach_campaigns')
      .select('*')
      .eq('instantly_campaign_id', event.campaign_id)
      .single();

    if (campaignError || !campaign) {
      console.warn('[Instantly Webhook] Campaign not found:', event.campaign_id);
      return NextResponse.json({ received: true });
    }

    // Handle different event types
    switch (event.type) {
      case 'email.sent':
        await handleEmailSent(supabase, campaign, event);
        break;

      case 'email.opened':
        await handleEmailOpened(supabase, campaign, event);
        break;

      case 'email.clicked':
        await handleEmailClicked(supabase, campaign, event);
        break;

      case 'email.replied':
        await handleEmailReplied(supabase, campaign, event);
        break;

      case 'email.bounced':
        await handleEmailBounced(supabase, campaign, event);
        break;

      default:
        console.log('[Instantly Webhook] Unknown event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Instantly Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleEmailSent(supabase: any, campaign: any, event: any) {
  console.log('[Webhook] Email sent:', event.lead_email);

  // Increment emails_sent counter
  await supabase
    .from('outreach_campaigns')
    .update({
      emails_sent: campaign.emails_sent + 1
    })
    .eq('id', campaign.id);

  // Update job_dispatches status
  await supabase
    .from('job_dispatches')
    .update({
      status: 'sent',
      sent_at: event.timestamp || new Date().toISOString()
    })
    .eq('campaign_id', campaign.id)
    .eq('technician_email', event.lead_email);
}

async function handleEmailOpened(supabase: any, campaign: any, event: any) {
  console.log('[Webhook] Email opened:', event.lead_email);

  // Increment emails_opened counter
  await supabase
    .from('outreach_campaigns')
    .update({
      emails_opened: campaign.emails_opened + 1
    })
    .eq('id', campaign.id);

  // Update job_dispatches status
  await supabase
    .from('job_dispatches')
    .update({
      status: 'opened',
      opened_at: event.timestamp || new Date().toISOString()
    })
    .eq('campaign_id', campaign.id)
    .eq('technician_email', event.lead_email);
}

async function handleEmailClicked(supabase: any, campaign: any, event: any) {
  console.log('[Webhook] Email clicked:', event.lead_email);

  // Update job_dispatches status
  await supabase
    .from('job_dispatches')
    .update({
      status: 'clicked',
      clicked_at: event.timestamp || new Date().toISOString()
    })
    .eq('campaign_id', campaign.id)
    .eq('technician_email', event.lead_email);
}

async function handleEmailReplied(supabase: any, campaign: any, event: any) {
  console.log('[Webhook] Email replied:', event.lead_email, event.reply_text);

  // Increment replies_received counter
  await supabase
    .from('outreach_campaigns')
    .update({
      replies_received: campaign.replies_received + 1
    })
    .eq('id', campaign.id);

  // Update job_dispatches status
  await supabase
    .from('job_dispatches')
    .update({
      status: 'replied',
      replied_at: event.timestamp || new Date().toISOString(),
      reply_text: event.reply_text || null
    })
    .eq('campaign_id', campaign.id)
    .eq('technician_email', event.lead_email);

  // TODO: Create notification for admin
  // TODO: Maybe update technician status to "interested"
}

async function handleEmailBounced(supabase: any, campaign: any, event: any) {
  console.log('[Webhook] Email bounced:', event.lead_email, event.bounce_reason);

  // Update job_dispatches status
  await supabase
    .from('job_dispatches')
    .update({
      status: 'bounced',
      bounced_at: event.timestamp || new Date().toISOString(),
      bounce_reason: event.bounce_reason || null
    })
    .eq('campaign_id', campaign.id)
    .eq('technician_email', event.lead_email);
}
