import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { classifyReply, generateAutoReply } from '@/lib/openai'

/**
 * SendGrid Inbound Parse Webhook
 *
 * Receives emails sent to replies@raven-search.com and matches them
 * to cold leads by sender email address.
 *
 * Setup:
 * 1. In SendGrid: Settings → Inbound Parse → Add Host/URL
 * 2. Domain: raven-search.com (or replies.raven-search.com)
 * 3. URL: https://ravensearch.ai/api/webhooks/sendgrid-inbound
 * 4. Check "POST the raw, full MIME message" if you want attachments
 *
 * DNS:
 * Add MX record: raven-search.com → mx.sendgrid.net (priority 10)
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Parse email address from "Name <email@domain.com>" format
function extractEmail(emailString: string): string {
  const match = emailString.match(/<([^>]+)>/)
  return match ? match[1] : emailString.trim()
}

// Clean up reply text - remove quoted previous emails
function cleanReplyText(text: string): string {
  if (!text) return ''

  // Remove common reply prefixes and quoted text
  const lines = text.split('\n')
  const cleanLines: string[] = []

  for (const line of lines) {
    // Stop at common reply indicators
    if (line.startsWith('On ') && line.includes(' wrote:')) break
    if (line.startsWith('From:')) break
    if (line.startsWith('>')) continue // Skip quoted lines
    if (line.includes('Original Message')) break

    cleanLines.push(line)
  }

  return cleanLines.join('\n').trim()
}

export async function POST(request: NextRequest) {
  try {
    // SendGrid sends multipart/form-data
    const formData = await request.formData()

    // Extract email fields
    const toRaw = formData.get('to') as string || ''
    const fromRaw = formData.get('from') as string || ''
    const subject = formData.get('subject') as string || ''
    const text = formData.get('text') as string || ''
    const html = formData.get('html') as string || ''
    const envelope = formData.get('envelope') as string || ''

    // Parse sender email
    const senderEmail = extractEmail(fromRaw).toLowerCase()

    console.log(`[SendGrid Inbound] Received email from: ${senderEmail}`)
    console.log(`[SendGrid Inbound] To: ${toRaw}`)
    console.log(`[SendGrid Inbound] Subject: ${subject}`)

    if (!senderEmail) {
      console.error('[SendGrid Inbound] No sender email found')
      return NextResponse.json({ error: 'No sender email' }, { status: 400 })
    }

    // Clean up the reply text
    const replyContent = cleanReplyText(text) || html

    // Find the most recently dispatched lead with this email
    const { data: lead, error: leadError } = await supabase
      .from('cold_leads')
      .select('id, email, full_name, company_name, trade_type, last_dispatched_at')
      .eq('email', senderEmail)
      .not('last_dispatched_at', 'is', null)
      .order('last_dispatched_at', { ascending: false })
      .limit(1)
      .single()

    if (leadError || !lead) {
      console.log(`[SendGrid Inbound] No matching lead found for: ${senderEmail}`)

      // Still store the email for manual review (optional)
      try {
        await supabase
          .from('inbound_emails_unmatched')
          .insert({
            from_email: senderEmail,
            to_email: toRaw,
            subject: subject,
            body: replyContent,
            received_at: new Date().toISOString()
          })
      } catch {
        // Ignore if table doesn't exist
      }

      return NextResponse.json({
        success: true,
        matched: false,
        message: 'No matching lead found'
      })
    }

    console.log(`[SendGrid Inbound] Matched to lead: ${lead.id} (${lead.full_name || lead.email})`)

    // Update the cold_leads record
    const { error: updateError } = await supabase
      .from('cold_leads')
      .update({
        has_replied: true,
        reply_received_at: new Date().toISOString(),
        reply_text: replyContent.slice(0, 10000), // Limit to 10k chars
        reply_subject: subject.slice(0, 500),
        status: 'replied',
        updated_at: new Date().toISOString()
      })
      .eq('id', lead.id)

    if (updateError) {
      console.error('[SendGrid Inbound] Failed to update lead:', updateError)
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    // Also update work_order_recipients if this lead was dispatched for a job
    const { error: recipientError } = await supabase
      .from('work_order_recipients')
      .update({
        replied_at: new Date().toISOString(),
        reply_text: replyContent.slice(0, 10000)
      })
      .eq('cold_lead_id', lead.id)
      .is('replied_at', null) // Only update if not already replied

    if (recipientError) {
      console.log('[SendGrid Inbound] No matching work_order_recipient or already replied')
    }

    // Update outreach campaign stats
    const { data: recipient } = await supabase
      .from('work_order_recipients')
      .select('outreach_id')
      .eq('cold_lead_id', lead.id)
      .limit(1)
      .single()

    if (recipient?.outreach_id) {
      await supabase.rpc('increment_cold_replies', {
        p_outreach_id: recipient.outreach_id
      })
    }

    // AI Classification and Auto-Reply Generation
    try {
      // Check if we've already auto-replied to this lead (loop prevention)
      const { data: existingReply } = await supabase
        .from('reply_queue')
        .select('id, status')
        .eq('cold_lead_id', lead.id)
        .in('status', ['pending_review', 'sent'])
        .limit(1)
        .single()

      if (existingReply) {
        console.log(`[SendGrid Inbound] Skipping auto-reply - already ${existingReply.status} for lead ${lead.id}`)
        return NextResponse.json({
          success: true,
          matched: true,
          leadId: lead.id,
          message: 'Reply recorded (auto-reply already sent or pending)'
        })
      }

      // Classify the reply intent
      const classification = await classifyReply(replyContent)
      console.log(`[SendGrid Inbound] Classification: ${classification.type} (${classification.confidence}) - ${classification.reason}`)

      // Only generate auto-reply for positive or question types
      if (classification.type === 'positive' || classification.type === 'question') {
        // Generate contextual reply
        const autoReply = await generateAutoReply({
          contractorName: lead.full_name?.split(' ')[0] || 'there',
          contractorEmail: senderEmail,
          tradeType: lead.trade_type || 'contractor',
          theirReply: replyContent,
          replyType: classification.type
        })

        // Queue for human review
        const { error: queueError } = await supabase
          .from('reply_queue')
          .insert({
            cold_lead_id: lead.id,
            original_subject: subject,
            original_body: replyContent,
            original_from: senderEmail,
            received_at: new Date().toISOString(),
            reply_type: classification.type,
            classification_confidence: classification.confidence,
            classification_reason: classification.reason,
            generated_subject: autoReply.subject,
            generated_body: autoReply.body,
            generation_prompt: autoReply.prompt,
            status: 'pending_review'
          })

        if (queueError) {
          console.error('[SendGrid Inbound] Failed to queue auto-reply:', queueError)
        } else {
          console.log(`[SendGrid Inbound] Auto-reply queued for review (${classification.type})`)
        }
      } else {
        console.log(`[SendGrid Inbound] Skipping auto-reply for ${classification.type} reply`)
      }
    } catch (aiError) {
      // Don't fail the whole webhook if AI processing fails
      console.error('[SendGrid Inbound] AI processing error (non-fatal):', aiError)
    }

    console.log(`[SendGrid Inbound] Successfully processed reply from ${senderEmail}`)

    return NextResponse.json({
      success: true,
      matched: true,
      leadId: lead.id,
      message: 'Reply recorded'
    })

  } catch (error) {
    console.error('[SendGrid Inbound] Error processing webhook:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Also handle GET for webhook verification (some services ping the URL)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'SendGrid Inbound Parse Webhook',
    endpoint: '/api/webhooks/sendgrid-inbound'
  })
}
