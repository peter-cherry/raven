import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Move verified license records to cold_leads table for outreach
 *
 * POST /api/leads/move-to-cold
 *
 * Request body:
 * {
 *   ids?: string[],           // Specific record IDs to move (optional)
 *   limit?: number,           // Max records to move (default 50)
 *   minConfidence?: number    // Min Hunter.io confidence to accept (default 70)
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   moved: number,
 *   skipped: number,
 *   results: MovedRecord[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      ids = null,
      limit = 50,
      minConfidence = 70
    } = body

    console.log(`[Move to Cold] Starting, limit: ${limit}, minConfidence: ${minConfidence}`)

    // Query verified records that haven't been moved yet
    let query = supabase
      .from('license_records')
      .select('*')
      .eq('ai_selected', true)
      .eq('email_verified', true)
      .eq('moved_to_cold_leads', false)
      .not('email', 'is', null)
      .gte('hunter_confidence', minConfidence)

    if (ids && ids.length > 0) {
      query = query.in('id', ids)
    }

    const { data: records, error: queryError } = await query.limit(limit)

    if (queryError) {
      console.error('[Move to Cold] Query error:', queryError)
      return NextResponse.json({
        success: false,
        error: `Database query failed: ${queryError.message}`
      }, { status: 500 })
    }

    if (!records || records.length === 0) {
      return NextResponse.json({
        success: true,
        moved: 0,
        skipped: 0,
        results: [],
        message: 'No verified records ready to move'
      })
    }

    console.log(`[Move to Cold] Processing ${records.length} records`)

    const results: Array<{
      stagingId: string
      coldLeadId: string | null
      email: string
      businessName: string | null
      status: 'moved' | 'skipped' | 'error'
      error?: string
    }> = []

    let moved = 0
    let skipped = 0

    // Check for existing emails in cold_leads to avoid duplicates
    const emails = records.map(r => r.email).filter(Boolean)
    const { data: existingLeads } = await supabase
      .from('cold_leads')
      .select('email')
      .in('email', emails)

    const existingEmails = new Set(existingLeads?.map(l => l.email) || [])

    // Process each record
    for (const record of records) {
      // Skip if email already in cold_leads
      if (existingEmails.has(record.email)) {
        console.log(`[Move to Cold] Skipping duplicate: ${record.email}`)

        // Mark as moved anyway to prevent re-processing
        await supabase
          .from('license_records')
          .update({
            moved_to_cold_leads: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id)

        skipped++
        results.push({
          stagingId: record.id,
          coldLeadId: null,
          email: record.email,
          businessName: record.business_name,
          status: 'skipped',
          error: 'Email already exists in cold_leads'
        })
        continue
      }

      // Build supersearch_query from trade type and location
      const tradeType = record.trade_type || 'General'
      const city = record.city || 'Unknown'
      const state = record.state || 'Unknown'
      const supersearchQuery = `${tradeType} contractors in ${city}, ${state}`

      // Map license_records fields to cold_leads schema
      const coldLead = {
        // Required fields
        email: record.email,
        supersearch_query: supersearchQuery,

        // Name fields
        full_name: record.full_name,
        first_name: record.first_name,
        last_name: record.last_name,
        company_name: record.business_name,
        job_title: record.job_title || 'Contractor',

        // Contact
        phone: record.phone,

        // Location
        city: record.city,
        state: record.state,
        country: 'USA',
        address: record.address,

        // Trade
        trade_type: record.trade_type,

        // License info
        lead_source: record.source,  // 'cslb' or 'dbpr'
        license_number: record.license_number,
        license_expiration: record.license_expiration,
        license_status: record.license_status,
        license_classification: record.license_classification,

        // Enrichment tracking
        email_verified: true,
        enriched_at: record.email_verification_date,
        enrichment_source: 'hunter.io',
        enrichment_credits_used: 1,

        // Dispatch tracking (defaults)
        dispatch_count: 0,
        has_replied: false,
        has_signed_up: false,

        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Insert into cold_leads
      const { data: insertedLead, error: insertError } = await supabase
        .from('cold_leads')
        .insert(coldLead)
        .select('id')
        .single()

      if (insertError) {
        console.error(`[Move to Cold] Insert error for ${record.email}:`, insertError)
        results.push({
          stagingId: record.id,
          coldLeadId: null,
          email: record.email,
          businessName: record.business_name,
          status: 'error',
          error: insertError.message
        })
        continue
      }

      // Update license_records to mark as moved
      const { error: updateError } = await supabase
        .from('license_records')
        .update({
          moved_to_cold_leads: true,
          cold_lead_id: insertedLead.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id)

      if (updateError) {
        console.error(`[Move to Cold] Update error for ${record.id}:`, updateError)
      }

      moved++
      results.push({
        stagingId: record.id,
        coldLeadId: insertedLead.id,
        email: record.email,
        businessName: record.business_name,
        status: 'moved'
      })

      console.log(`[Move to Cold] Moved: ${record.email} -> cold_lead ${insertedLead.id}`)
    }

    console.log(`[Move to Cold] Complete: ${moved} moved, ${skipped} skipped`)

    return NextResponse.json({
      success: true,
      moved,
      skipped,
      results,
      message: `Moved ${moved} leads to cold_leads (${skipped} skipped as duplicates)`
    })

  } catch (error) {
    console.error('[Move to Cold] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get move-to-cold stats
 */
export async function GET() {
  try {
    // Count records ready to move (verified but not moved)
    const { count: readyToMove } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('ai_selected', true)
      .eq('email_verified', true)
      .eq('moved_to_cold_leads', false)

    // Count already moved
    const { count: alreadyMoved } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('moved_to_cold_leads', true)

    // Count cold_leads by source
    const { data: coldLeadsBySource } = await supabase
      .from('cold_leads')
      .select('lead_source')

    const sourceCounts: Record<string, number> = {}
    coldLeadsBySource?.forEach(lead => {
      const src = lead.lead_source || 'unknown'
      sourceCounts[src] = (sourceCounts[src] || 0) + 1
    })

    // Get recent moves
    const { data: recentMoves } = await supabase
      .from('license_records')
      .select('email, business_name, cold_lead_id, updated_at')
      .eq('moved_to_cold_leads', true)
      .order('updated_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      stats: {
        readyToMove: readyToMove || 0,
        alreadyMoved: alreadyMoved || 0,
        coldLeadsBySource: sourceCounts
      },
      recentMoves: recentMoves || []
    })
  } catch (error) {
    console.error('[Move to Cold Stats] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
