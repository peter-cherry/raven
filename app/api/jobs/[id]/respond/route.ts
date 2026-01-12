import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors when env vars aren't set
let _supabaseAdmin: any = null

const getSupabaseAdmin = (): any => {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Supabase credentials not configured')
    }
    _supabaseAdmin = createClient(url, key)
  }
  return _supabaseAdmin
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params
  const searchParams = request.nextUrl.searchParams
  const techId = searchParams.get('tech')
  const recipientId = searchParams.get('r') // recipient ID from work_order_recipients
  const response = searchParams.get('response') // 'interested' or 'decline'

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
  }

  // If response is provided, process it and redirect to confirmation
  if (response && recipientId) {
    try {
      const now = new Date().toISOString()

      if (response === 'interested') {
        // Update recipient as interested/qualified
        await getSupabaseAdmin()
          .from('work_order_recipients')
          .update({
            reply_received: true,
            reply_received_at: now,
            ai_qualified: true,
            qualification_reason: 'Clicked interested link in email',
            qualified_at: now,
            updated_at: now
          })
          .eq('id', recipientId)

        // Get recipient details to update outreach stats
        const { data: recipient } = await getSupabaseAdmin()
          .from('work_order_recipients')
          .select('outreach_id, dispatch_method')
          .eq('id', recipientId)
          .single()

        if (recipient) {
          // Increment qualified count based on dispatch method
          if (recipient.dispatch_method === 'sendgrid_warm') {
            await getSupabaseAdmin().rpc('increment_warm_qualified', { p_outreach_id: recipient.outreach_id })
            await getSupabaseAdmin().rpc('increment_warm_replied', { p_outreach_id: recipient.outreach_id })
          }
        }
      } else if (response === 'decline') {
        // Update recipient as declined
        await getSupabaseAdmin()
          .from('work_order_recipients')
          .update({
            reply_received: true,
            reply_received_at: now,
            ai_qualified: false,
            qualification_reason: 'Clicked decline link in email',
            updated_at: now
          })
          .eq('id', recipientId)
      }

      // Redirect to confirmation page
      const confirmUrl = new URL(`/jobs/${jobId}/respond/confirmed`, request.url)
      confirmUrl.searchParams.set('response', response)
      return NextResponse.redirect(confirmUrl)

    } catch (error) {
      console.error('[Respond] Error processing response:', error)
      return NextResponse.json({ error: 'Failed to process response' }, { status: 500 })
    }
  }

  // If no response, show the job details page
  try {
    // Get job details
    const { data: job, error: jobError } = await getSupabaseAdmin()
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Return job details for the response page to render
    return NextResponse.json({
      job: {
        id: job.id,
        job_title: job.job_title,
        trade_needed: job.trade_needed,
        city: job.city,
        state: job.state,
        urgency: job.urgency,
        scheduled_at: job.scheduled_at,
        duration: job.duration,
        budget_min: job.budget_min,
        budget_max: job.budget_max,
        description: job.description
      },
      recipientId,
      techId
    })

  } catch (error) {
    console.error('[Respond] Error fetching job:', error)
    return NextResponse.json({ error: 'Failed to fetch job details' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const body = await request.json()
    const { recipientId, response, techId } = body

    if (!jobId || !recipientId || !response) {
      return NextResponse.json(
        { error: 'Job ID, recipient ID, and response are required' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    if (response === 'interested') {
      // Update recipient as interested/qualified
      await getSupabaseAdmin()
        .from('work_order_recipients')
        .update({
          reply_received: true,
          reply_received_at: now,
          ai_qualified: true,
          qualification_reason: 'Clicked interested button on response page',
          qualified_at: now,
          updated_at: now
        })
        .eq('id', recipientId)

      // Get recipient details to update outreach stats
      const { data: recipient } = await getSupabaseAdmin()
        .from('work_order_recipients')
        .select('outreach_id, dispatch_method')
        .eq('id', recipientId)
        .single()

      if (recipient) {
        // Increment qualified count based on dispatch method
        if (recipient.dispatch_method === 'sendgrid_warm') {
          await getSupabaseAdmin().rpc('increment_warm_qualified', { p_outreach_id: recipient.outreach_id })
          await getSupabaseAdmin().rpc('increment_warm_replied', { p_outreach_id: recipient.outreach_id })
        }
      }

      return NextResponse.json({ success: true, message: 'Response recorded successfully' })

    } else if (response === 'decline') {
      // Update recipient as declined
      await getSupabaseAdmin()
        .from('work_order_recipients')
        .update({
          reply_received: true,
          reply_received_at: now,
          ai_qualified: false,
          qualification_reason: 'Clicked decline button on response page',
          updated_at: now
        })
        .eq('id', recipientId)

      return NextResponse.json({ success: true, message: 'Response recorded successfully' })
    }

    return NextResponse.json({ error: 'Invalid response type' }, { status: 400 })

  } catch (error) {
    console.error('[Respond] POST Error:', error)
    return NextResponse.json({ error: 'Failed to process response' }, { status: 500 })
  }
}
