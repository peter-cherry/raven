import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

/**
 * Batch enrich pending targets
 * Processes up to `limit` targets from the enrichment queue
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { limit = 10 } = body

    console.log(`[Enrich Batch] Starting batch enrichment for up to ${limit} targets`)

    // Get pending targets from the queue
    const { data: queue, error: queueError } = await supabase
      .from('email_enrichment_queue')
      .select('target_id, domain')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit)

    if (queueError) {
      console.error('[Enrich Batch] Failed to fetch queue:', queueError)
      return NextResponse.json(
        { success: false, error: queueError.message },
        { status: 500 }
      )
    }

    if (!queue || queue.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No pending targets to enrich'
      })
    }

    console.log(`[Enrich Batch] Found ${queue.length} pending targets`)

    // Process each target
    const results = {
      processed: 0,
      successCount: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const item of queue) {
      try {
        // Call the enrich-emails Edge Function
        const response = await fetch(`${SUPABASE_URL}/functions/v1/enrich-emails`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ target_id: item.target_id })
        })

        const data = await response.json()

        if (data.success) {
          results.successCount++
        } else {
          results.failed++
          results.errors.push(`${item.target_id}: ${data.error}`)
        }

        results.processed++

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        results.failed++
        results.errors.push(`${item.target_id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        results.processed++
      }
    }

    console.log(`[Enrich Batch] Completed: ${results.successCount} success, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      ...results
    })
  } catch (error) {
    console.error('[Enrich Batch] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Get enrichment stats
 */
export async function GET() {
  try {
    // Count pending in queue
    const { count: pendingCount } = await supabase
      .from('email_enrichment_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Count completed this month (for Hunter.io quota tracking)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: enrichedThisMonth } = await supabase
      .from('email_enrichment_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', startOfMonth.toISOString())

    // Count total targets
    const { count: totalTargets } = await supabase
      .from('outreach_targets')
      .select('*', { count: 'exact', head: true })

    // Count targets with emails found
    const { count: emailsFound } = await supabase
      .from('outreach_targets')
      .select('*', { count: 'exact', head: true })
      .eq('email_found', true)

    // Count verified emails
    const { count: emailsVerified } = await supabase
      .from('outreach_targets')
      .select('*', { count: 'exact', head: true })
      .eq('email_verified', true)

    return NextResponse.json({
      success: true,
      stats: {
        pending: pendingCount || 0,
        enrichedThisMonth: enrichedThisMonth || 0,
        monthlyLimit: 150, // Hunter.io free tier
        totalTargets: totalTargets || 0,
        emailsFound: emailsFound || 0,
        emailsVerified: emailsVerified || 0
      }
    })
  } catch (error) {
    console.error('[Enrich Stats] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
