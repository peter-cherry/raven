/**
 * Lead Pipeline Orchestrator
 *
 * Automates the flow from license_records staging table to cold_leads:
 * 1. AI Selection - Match contractors to job criteria
 * 2. Hunter.io Verification - Find and verify emails
 * 3. Move to Cold Leads - Insert verified records for dispatch
 */

import { createClient } from '@supabase/supabase-js'
import { selectContractors, SelectionCriteria, LicenseRecord } from './ai-lead-selector'
import { findEmail, getAccountInfo } from './hunter-verification'

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface PipelineJob {
  id: string
  city: string
  state: string
  trade_needed: string
  lat?: number
  lng?: number
}

export interface PipelineConfig {
  selectLimit?: number        // Max contractors to AI-select (default 20)
  verifyLimit?: number        // Max contractors to verify (default 10)
  minConfidence?: number      // Min Hunter.io confidence (default 70)
  skipIfColdExists?: boolean  // Skip pipeline if matching cold leads exist (default true)
}

export interface PipelineResult {
  success: boolean
  pipelineRan: boolean
  selected: number
  verified: number
  movedToCold: number
  coldLeadIds: string[]
  error?: string
  skippedReason?: string
  hunterCreditsUsed?: number
}

/**
 * Run the full lead pipeline for a job
 *
 * @param job - Job details to match contractors to
 * @param config - Pipeline configuration options
 * @returns PipelineResult with counts and cold lead IDs
 */
export async function runLeadPipeline(
  job: PipelineJob,
  config: PipelineConfig = {}
): Promise<PipelineResult> {
  const {
    selectLimit = 20,
    verifyLimit = 10,
    minConfidence = 70,
    skipIfColdExists = true
  } = config

  console.log(`[Lead Pipeline] Starting for job ${job.id}`)
  console.log(`[Lead Pipeline] Criteria: ${job.trade_needed} in ${job.city}, ${job.state}`)

  try {
    // Check if we should skip based on existing cold leads
    if (skipIfColdExists) {
      const { count } = await supabase
        .from('cold_leads')
        .select('*', { count: 'exact', head: true })
        .eq('state', job.state)
        .ilike('trade_type', `%${job.trade_needed}%`)
        .eq('dispatch_count', 0)  // Not yet dispatched
        .limit(1)

      if (count && count > 0) {
        console.log(`[Lead Pipeline] Skipped - ${count} matching cold leads already exist`)
        return {
          success: true,
          pipelineRan: false,
          selected: 0,
          verified: 0,
          movedToCold: 0,
          coldLeadIds: [],
          skippedReason: `${count} matching cold leads already exist`
        }
      }
    }

    // Check Hunter.io credits before starting
    const accountInfo = await getAccountInfo()
    if (!accountInfo.success) {
      return {
        success: false,
        pipelineRan: false,
        selected: 0,
        verified: 0,
        movedToCold: 0,
        coldLeadIds: [],
        error: accountInfo.error || 'Failed to check Hunter.io account status'
      }
    }

    const availableSearches = accountInfo.searches?.available || 0
    if (availableSearches < verifyLimit) {
      console.warn(`[Lead Pipeline] Low Hunter.io credits: ${availableSearches} available`)
      if (availableSearches === 0) {
        return {
          success: false,
          pipelineRan: false,
          selected: 0,
          verified: 0,
          movedToCold: 0,
          coldLeadIds: [],
          error: 'No Hunter.io credits available'
        }
      }
    }

    // Step 1: AI Selection
    console.log(`[Lead Pipeline] Step 1: AI Selection (limit ${selectLimit})`)

    // Fetch candidates from license_records
    const { data: candidates, error: fetchError } = await supabase
      .from('license_records')
      .select('*')
      .eq('ai_selected', false)
      .eq('state', job.state)
      .order('created_at', { ascending: false })
      .limit(100)  // Get more than we need for AI to rank

    if (fetchError) {
      console.error('[Lead Pipeline] Failed to fetch candidates:', fetchError)
      return {
        success: false,
        pipelineRan: false,
        selected: 0,
        verified: 0,
        movedToCold: 0,
        coldLeadIds: [],
        error: `Database error: ${fetchError.message}`
      }
    }

    if (!candidates || candidates.length === 0) {
      console.log('[Lead Pipeline] No candidates in license_records')
      return {
        success: true,
        pipelineRan: true,
        selected: 0,
        verified: 0,
        movedToCold: 0,
        coldLeadIds: [],
        skippedReason: 'No candidates available in staging table'
      }
    }

    const selectionCriteria: SelectionCriteria = {
      jobCity: job.city,
      jobState: job.state,
      jobLat: job.lat,
      jobLng: job.lng,
      tradeNeeded: job.trade_needed,
      limit: selectLimit
    }

    // Cast to LicenseRecord type
    const contractorsToRank: LicenseRecord[] = candidates.map(c => ({
      id: c.id,
      source: c.source,
      license_number: c.license_number,
      license_status: c.license_status,
      license_classification: c.license_classification,
      license_expiration: c.license_expiration,
      business_name: c.business_name,
      full_name: c.full_name,
      first_name: c.first_name,
      last_name: c.last_name,
      job_title: c.job_title,
      phone: c.phone,
      address: c.address,
      city: c.city,
      state: c.state,
      zip: c.zip,
      trade_type: c.trade_type,
      lat: c.lat,
      lng: c.lng
    }))

    const selectionResult = await selectContractors(contractorsToRank, selectionCriteria)

    if (!selectionResult.success || selectionResult.selected.length === 0) {
      console.log(`[Lead Pipeline] No contractors selected: ${selectionResult.error || 'No matches'}`)
      return {
        success: true,
        pipelineRan: true,
        selected: 0,
        verified: 0,
        movedToCold: 0,
        coldLeadIds: [],
        skippedReason: selectionResult.error || 'No contractors matched selection criteria'
      }
    }

    // Mark selected contractors as ai_selected in database
    const selectedIds = selectionResult.selected.map(s => s.id)
    const { error: updateError } = await supabase
      .from('license_records')
      .update({
        ai_selected: true,
        ai_selection_date: new Date().toISOString(),
        ai_selection_score: selectionResult.selected[0]?.score || 0,  // Store top score
        updated_at: new Date().toISOString()
      })
      .in('id', selectedIds)

    if (updateError) {
      console.error('[Lead Pipeline] Failed to mark selections:', updateError)
    }

    console.log(`[Lead Pipeline] Selected ${selectionResult.selected.length} contractors`)

    // Step 2: Hunter.io Email Verification
    console.log(`[Lead Pipeline] Step 2: Email Verification (limit ${verifyLimit})`)

    // Get selected records that need verification
    const { data: recordsToVerify } = await supabase
      .from('license_records')
      .select('*')
      .eq('ai_selected', true)
      .eq('email_verified', false)
      .is('email', null)
      .limit(Math.min(verifyLimit, availableSearches))

    let verifiedCount = 0
    let creditsUsed = 0
    const verifiedRecordIds: string[] = []

    if (recordsToVerify && recordsToVerify.length > 0) {
      for (const record of recordsToVerify) {
        const result = await findEmail({
          firstName: record.first_name || undefined,
          lastName: record.last_name || undefined,
          fullName: record.full_name || undefined,
          company: record.business_name || undefined
        })

        creditsUsed++
        const now = new Date().toISOString()

        if (result.success && result.email && result.confidence >= minConfidence) {
          // Update record with verified email
          await supabase
            .from('license_records')
            .update({
              email: result.email,
              email_verified: true,
              email_verification_date: now,
              hunter_confidence: result.confidence,
              updated_at: now
            })
            .eq('id', record.id)

          verifiedCount++
          verifiedRecordIds.push(record.id)
          console.log(`[Lead Pipeline] Verified: ${result.email} (${result.confidence}%)`)
        } else {
          // Update record with failed attempt
          await supabase
            .from('license_records')
            .update({
              email: result.email || null,
              email_verified: false,
              email_verification_date: now,
              hunter_confidence: result.confidence,
              updated_at: now
            })
            .eq('id', record.id)

          console.log(`[Lead Pipeline] Failed: ${record.business_name} - ${result.error || 'low confidence'}`)
        }

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    console.log(`[Lead Pipeline] Verified ${verifiedCount} emails`)

    // Step 3: Move to Cold Leads
    console.log('[Lead Pipeline] Step 3: Move to Cold Leads')

    // Get verified records that haven't been moved
    const { data: recordsToMove } = await supabase
      .from('license_records')
      .select('*')
      .eq('ai_selected', true)
      .eq('email_verified', true)
      .eq('moved_to_cold_leads', false)
      .not('email', 'is', null)
      .gte('hunter_confidence', minConfidence)

    const coldLeadIds: string[] = []

    if (recordsToMove && recordsToMove.length > 0) {
      // Check for existing emails in cold_leads
      const emails = recordsToMove.map(r => r.email).filter(Boolean)
      const { data: existingLeads } = await supabase
        .from('cold_leads')
        .select('email')
        .in('email', emails)

      const existingEmails = new Set(existingLeads?.map(l => l.email) || [])

      for (const record of recordsToMove) {
        // Skip duplicates
        if (existingEmails.has(record.email)) {
          await supabase
            .from('license_records')
            .update({
              moved_to_cold_leads: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', record.id)
          continue
        }

        // Build supersearch_query
        const tradeType = record.trade_type || 'General'
        const city = record.city || 'Unknown'
        const state = record.state || 'Unknown'
        const supersearchQuery = `${tradeType} contractors in ${city}, ${state}`

        // Map to cold_leads schema
        const coldLead = {
          email: record.email,
          supersearch_query: supersearchQuery,
          full_name: record.full_name,
          first_name: record.first_name,
          last_name: record.last_name,
          company_name: record.business_name,
          job_title: record.job_title || 'Contractor',
          phone: record.phone,
          city: record.city,
          state: record.state,
          country: 'USA',
          address: record.address,
          trade_type: record.trade_type,
          lead_source: record.source,
          license_number: record.license_number,
          license_expiration: record.license_expiration,
          license_status: record.license_status,
          license_classification: record.license_classification,
          email_verified: true,
          enriched_at: record.email_verification_date,
          enrichment_source: 'hunter.io',
          enrichment_credits_used: 1,
          dispatch_count: 0,
          has_replied: false,
          has_signed_up: false,
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
          console.error(`[Lead Pipeline] Insert error for ${record.email}:`, insertError)
          continue
        }

        // Update license_records
        await supabase
          .from('license_records')
          .update({
            moved_to_cold_leads: true,
            cold_lead_id: insertedLead.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id)

        coldLeadIds.push(insertedLead.id)
        console.log(`[Lead Pipeline] Moved: ${record.email} -> cold_lead ${insertedLead.id}`)
      }
    }

    console.log(`[Lead Pipeline] Complete: ${selectionResult.selected.length} selected, ${verifiedCount} verified, ${coldLeadIds.length} moved`)

    return {
      success: true,
      pipelineRan: true,
      selected: selectionResult.selected.length,
      verified: verifiedCount,
      movedToCold: coldLeadIds.length,
      coldLeadIds,
      hunterCreditsUsed: creditsUsed
    }

  } catch (error) {
    console.error('[Lead Pipeline] Error:', error)
    return {
      success: false,
      pipelineRan: false,
      selected: 0,
      verified: 0,
      movedToCold: 0,
      coldLeadIds: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get pipeline status for a job
 */
export async function getPipelineStatus(jobId: string): Promise<{
  canRun: boolean
  reason?: string
  hunterCredits?: number
  pendingVerification?: number
  readyToMove?: number
}> {
  try {
    // Check Hunter.io credits
    const accountInfo = await getAccountInfo()
    const hunterCredits = accountInfo.searches?.available || 0

    // Count records pending verification
    const { count: pendingVerification } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('ai_selected', true)
      .eq('email_verified', false)
      .is('email', null)

    // Count records ready to move
    const { count: readyToMove } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('ai_selected', true)
      .eq('email_verified', true)
      .eq('moved_to_cold_leads', false)

    let canRun = true
    let reason: string | undefined

    if (hunterCredits === 0) {
      canRun = false
      reason = 'No Hunter.io credits available'
    } else if ((pendingVerification || 0) === 0 && (readyToMove || 0) === 0) {
      canRun = false
      reason = 'No records available for pipeline'
    }

    return {
      canRun,
      reason,
      hunterCredits,
      pendingVerification: pendingVerification || 0,
      readyToMove: readyToMove || 0
    }
  } catch (error) {
    return {
      canRun: false,
      reason: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
