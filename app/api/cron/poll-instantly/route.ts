import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { instantlyV2Client } from '@/lib/instantly/supersearch';

/**
 * Reply Polling Cron Job
 *
 * Polls Instantly for unread email replies every 5 minutes.
 * When a reply is found:
 * 1. Match to outreach recipient
 * 2. Update recipient status
 * 3. Trigger AI qualification
 * 4. Mark email as read in Instantly
 *
 * Schedule: Every 5 minutes (cron: 0,5,10,15... * * * *)
 * Requires: Vercel Pro plan for sub-daily crons
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute timeout

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('[Poll] Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Poll] Starting Instantly reply polling...');

    // Initialize Supabase service client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get unread emails from Instantly
    const unreadEmails = await instantlyV2Client.listUnreadEmails(100);

    console.log(`[Poll] Found ${unreadEmails.length} unread emails`);

    let processed = 0;
    let matched = 0;
    let qualified = 0;

    for (const email of unreadEmails) {
      try {
        // Extract sender email
        const senderEmail = email.from_email || email.from || email.sender;

        if (!senderEmail) {
          console.log('[Poll] Email missing sender:', email.id);
          continue;
        }

        processed++;

        // Try to match to a cold lead
        const { data: coldLead } = await supabase
          .from('cold_leads')
          .select('id, email, full_name')
          .eq('email', senderEmail.toLowerCase())
          .single();

        if (coldLead) {
          matched++;

          // Update cold lead as replied
          await supabase
            .from('cold_leads')
            .update({
              has_replied: true,
              reply_received_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', coldLead.id);

          // Find the recipient record
          const { data: recipient } = await supabase
            .from('work_order_recipients')
            .select('id, outreach_id')
            .eq('cold_lead_id', coldLead.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (recipient) {
            // Update recipient with reply info
            await supabase
              .from('work_order_recipients')
              .update({
                reply_received: true,
                reply_text: email.body || email.text || email.content,
                reply_received_at: email.received_at || new Date().toISOString(),
                email_opened: true,
              })
              .eq('id', recipient.id);

            // Update outreach cold_replied count
            await supabase.rpc('increment_cold_replied', {
              p_outreach_id: recipient.outreach_id,
            });

            // Trigger AI qualification
            const qualificationResult = await qualifyReply(
              supabase,
              recipient.id,
              email.body || email.text || '',
              coldLead
            );

            if (qualificationResult.qualified) {
              qualified++;

              // Update cold_qualified count
              await supabase.rpc('increment_cold_qualified', {
                p_outreach_id: recipient.outreach_id,
              });
            }
          }
        }

        // Also check warm technicians
        const { data: technician } = await supabase
          .from('technicians')
          .select('id, email, full_name')
          .eq('email', senderEmail.toLowerCase())
          .single();

        if (technician) {
          matched++;

          // Find the recipient record
          const { data: recipient } = await supabase
            .from('work_order_recipients')
            .select('id, outreach_id')
            .eq('technician_id', technician.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (recipient) {
            // Update recipient with reply info
            await supabase
              .from('work_order_recipients')
              .update({
                reply_received: true,
                reply_text: email.body || email.text || email.content,
                reply_received_at: email.received_at || new Date().toISOString(),
                email_opened: true,
              })
              .eq('id', recipient.id);

            // Update outreach warm_replied count
            await supabase.rpc('increment_warm_replied', {
              p_outreach_id: recipient.outreach_id,
            });

            // Trigger AI qualification
            const qualificationResult = await qualifyReply(
              supabase,
              recipient.id,
              email.body || email.text || '',
              technician
            );

            if (qualificationResult.qualified) {
              qualified++;

              // Update warm_qualified count
              await supabase.rpc('increment_warm_qualified', {
                p_outreach_id: recipient.outreach_id,
              });
            }
          }
        }

        // Mark email as read in Instantly
        await instantlyV2Client.markEmailRead(email.id);

      } catch (emailError) {
        console.error('[Poll] Error processing email:', email.id, emailError);
      }
    }

    console.log(`[Poll] Complete: ${processed} processed, ${matched} matched, ${qualified} qualified`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processed,
      matched,
      qualified,
    });

  } catch (error: any) {
    console.error('[Poll] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Polling failed' },
      { status: 500 }
    );
  }
}

/**
 * AI Qualification of Reply
 *
 * Analyzes reply text to determine if technician is:
 * - Interested and available
 * - Has questions
 * - Declined
 */
async function qualifyReply(
  supabase: any,
  recipientId: string,
  replyText: string,
  contact: { id: string; email: string; full_name?: string }
): Promise<{ qualified: boolean; reason: string }> {
  try {
    // Simple keyword-based qualification (replace with AI in production)
    const lowerReply = replyText.toLowerCase();

    // Positive indicators
    const positiveKeywords = [
      'interested',
      'available',
      'yes',
      'i can',
      "i'm available",
      'when',
      'what time',
      'more details',
      'tell me more',
      'sounds good',
      'let me know',
      'call me',
      'contact me',
    ];

    // Negative indicators
    const negativeKeywords = [
      'not interested',
      'no thanks',
      'unsubscribe',
      'remove me',
      'too busy',
      'not available',
      'pass',
      'decline',
    ];

    const hasPositive = positiveKeywords.some(kw => lowerReply.includes(kw));
    const hasNegative = negativeKeywords.some(kw => lowerReply.includes(kw));

    let qualified = false;
    let reason = 'unclassified';

    if (hasNegative) {
      qualified = false;
      reason = 'declined';
    } else if (hasPositive) {
      qualified = true;
      reason = 'interested';
    } else if (replyText.length > 20) {
      // If they wrote a substantial reply, likely interested
      qualified = true;
      reason = 'engaged';
    }

    // Update recipient qualification status
    await supabase
      .from('work_order_recipients')
      .update({
        ai_qualified: qualified,
        qualification_reason: reason,
        qualified_at: qualified ? new Date().toISOString() : null,
      })
      .eq('id', recipientId);

    console.log(`[Qualify] ${contact.email}: ${qualified ? '✓ Qualified' : '✗ Not qualified'} (${reason})`);

    return { qualified, reason };

  } catch (error) {
    console.error('[Qualify] Error:', error);
    return { qualified: false, reason: 'error' };
  }
}
