import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const FROM_EMAIL = 'peter@raven-search.com'
const FROM_NAME = 'Peter from Ravensearch'
const REPLY_TO_EMAIL = 'replies@replies.raven-search.com'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const { editedBody, editedSubject } = body

    // Get the queued reply with cold_lead data
    const { data: queuedReply, error: fetchError } = await supabase
      .from('reply_queue')
      .select('*, cold_leads(full_name, email, trade_type)')
      .eq('id', params.id)
      .single()

    if (fetchError || !queuedReply) {
      console.error('[Send Reply] Reply not found:', params.id, fetchError)
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    if (queuedReply.status === 'sent') {
      return NextResponse.json({ error: 'Reply already sent' }, { status: 400 })
    }

    // Use edited content if provided, otherwise use generated
    const subjectToSend = editedSubject || queuedReply.generated_subject
    const bodyToSend = editedBody || queuedReply.generated_body

    console.log(`[Send Reply] Sending to ${queuedReply.original_from}`)
    console.log(`[Send Reply] Subject: ${subjectToSend}`)

    // Send via SendGrid
    const sgResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: queuedReply.original_from }]
        }],
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME
        },
        reply_to: { email: REPLY_TO_EMAIL },
        subject: subjectToSend,
        content: [{
          type: 'text/plain',
          value: bodyToSend
        }],
        tracking_settings: {
          click_tracking: { enable: true },
          open_tracking: { enable: true }
        }
      })
    })

    if (!sgResponse.ok) {
      const errorText = await sgResponse.text()
      console.error('[Send Reply] SendGrid error:', sgResponse.status, errorText)
      return NextResponse.json(
        { error: 'Failed to send email', details: errorText },
        { status: 500 }
      )
    }

    // Get SendGrid message ID from headers
    const messageId = sgResponse.headers.get('x-message-id') || null

    // Update queue status to sent
    const { error: updateError } = await supabase
      .from('reply_queue')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        edited_body: editedBody || null,
        sendgrid_message_id: messageId,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('[Send Reply] Failed to update queue status:', updateError)
      // Email was sent, so still return success
    }

    console.log(`[Send Reply] Successfully sent reply to ${queuedReply.original_from}`)

    return NextResponse.json({
      success: true,
      messageId,
      sentTo: queuedReply.original_from
    })

  } catch (error) {
    console.error('[Send Reply] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Reject a queued reply
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('reply_queue')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (error) {
      console.error('[Send Reply] Failed to reject:', error)
      return NextResponse.json({ error: 'Failed to reject' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Send Reply] Error rejecting:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
