import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { selectContractors, LicenseRecord, SelectionCriteria } from '@/lib/ai-lead-selector'

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * AI-powered contractor selection endpoint
 *
 * POST /api/leads/select
 *
 * Request body:
 * {
 *   jobCity: string,       // City where job is located
 *   jobState: string,      // State where job is located (2-letter code)
 *   tradeNeeded: string,   // 'HVAC', 'Plumbing', 'Electrical'
 *   limit?: number,        // Max contractors to select (default 20)
 *   jobId?: string,        // Optional job ID to associate selection with
 *   sources?: string[]     // Optional filter by source ('cslb', 'dbpr')
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   selected: SelectedContractor[],
 *   totalCandidates: number,
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      jobCity,
      jobState,
      tradeNeeded,
      limit = 20,
      jobId = null,
      sources = ['cslb', 'dbpr']
    } = body

    // Validate required fields
    if (!jobCity || !jobState || !tradeNeeded) {
      return NextResponse.json(
        { success: false, error: 'jobCity, jobState, and tradeNeeded are required' },
        { status: 400 }
      )
    }

    // Validate trade type
    const validTrades = ['HVAC', 'Plumbing', 'Electrical', 'General']
    if (!validTrades.includes(tradeNeeded)) {
      return NextResponse.json(
        { success: false, error: `Invalid tradeNeeded. Must be one of: ${validTrades.join(', ')}` },
        { status: 400 }
      )
    }

    console.log(`[AI Selection] Starting selection for ${tradeNeeded} job in ${jobCity}, ${jobState}`)

    // Query staging table for candidates
    let query = supabase
      .from('license_records')
      .select('*')
      .eq('ai_selected', false)  // Only unselected records
      .eq('moved_to_cold_leads', false)  // Not already moved
      .in('source', sources)

    // Filter by state to reduce query size
    query = query.eq('state', jobState)

    // Execute query (limit to 1000 to prevent memory issues)
    const { data: candidates, error: queryError } = await query.limit(1000)

    if (queryError) {
      console.error('[AI Selection] Query error:', queryError)
      return NextResponse.json(
        { success: false, error: `Database query failed: ${queryError.message}` },
        { status: 500 }
      )
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        success: true,
        selected: [],
        totalCandidates: 0,
        message: `No candidates found in ${jobState} for ${tradeNeeded}`
      })
    }

    console.log(`[AI Selection] Found ${candidates.length} candidates in staging table`)

    // Build selection criteria
    const criteria: SelectionCriteria = {
      jobCity,
      jobState,
      tradeNeeded,
      limit: Math.min(limit, 100)  // Cap at 100
    }

    // Run AI selection
    const result = await selectContractors(candidates as LicenseRecord[], criteria)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Selection failed',
        totalCandidates: result.totalCandidates
      })
    }

    // Update selected records in staging table
    if (result.selected.length > 0) {
      const selectedIds = result.selected.map(s => s.id)
      const now = new Date().toISOString()

      for (const selected of result.selected) {
        const { error: updateError } = await supabase
          .from('license_records')
          .update({
            ai_selected: true,
            ai_score: selected.score,
            ai_selection_reason: selected.reason,
            selected_for_job_id: jobId,
            updated_at: now
          })
          .eq('id', selected.id)

        if (updateError) {
          console.error(`[AI Selection] Failed to update record ${selected.id}:`, updateError)
        }
      }

      console.log(`[AI Selection] Marked ${selectedIds.length} records as AI-selected`)
    }

    return NextResponse.json({
      success: true,
      selected: result.selected.map(s => ({
        id: s.id,
        score: s.score,
        reason: s.reason,
        businessName: s.contractor.business_name,
        fullName: s.contractor.full_name,
        city: s.contractor.city,
        state: s.contractor.state,
        tradeType: s.contractor.trade_type,
        phone: s.contractor.phone,
        licenseNumber: s.contractor.license_number,
        licenseStatus: s.contractor.license_status
      })),
      totalCandidates: result.totalCandidates,
      message: `Selected ${result.selected.length} contractors for ${tradeNeeded} job in ${jobCity}, ${jobState}`
    })

  } catch (error) {
    console.error('[AI Selection] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Get AI selection stats
 */
export async function GET() {
  try {
    // Count total AI-selected records
    const { count: totalSelected } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('ai_selected', true)

    // Count pending selection
    const { count: pendingSelection } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('ai_selected', false)
      .eq('moved_to_cold_leads', false)

    // Count by source
    const { data: bySource } = await supabase
      .from('license_records')
      .select('source, ai_selected')

    const sourceCounts: Record<string, { total: number; selected: number }> = {}
    bySource?.forEach(record => {
      const src = record.source || 'unknown'
      if (!sourceCounts[src]) {
        sourceCounts[src] = { total: 0, selected: 0 }
      }
      sourceCounts[src].total++
      if (record.ai_selected) {
        sourceCounts[src].selected++
      }
    })

    // Get average score of selected records
    const { data: selectedRecords } = await supabase
      .from('license_records')
      .select('ai_score')
      .eq('ai_selected', true)
      .not('ai_score', 'is', null)

    let avgScore = 0
    if (selectedRecords && selectedRecords.length > 0) {
      const totalScore = selectedRecords.reduce((sum, r) => sum + (r.ai_score || 0), 0)
      avgScore = Math.round(totalScore / selectedRecords.length)
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalSelected: totalSelected || 0,
        pendingSelection: pendingSelection || 0,
        averageScore: avgScore,
        bySource: sourceCounts
      }
    })
  } catch (error) {
    console.error('[AI Selection Stats] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
