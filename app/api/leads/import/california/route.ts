import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Initialize Supabase admin client lazily to handle missing env vars
function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    return null
  }
  
  return createClient(url, serviceKey)
}

// CA CSLB Trade Classifications we're interested in
// Reference: https://www.cslb.ca.gov/About_Us/Library/Licensing_Classifications/
// Note: Data may contain codes with OR without dashes (C-20 or C20)
const TARGET_CLASSIFICATIONS: Record<string, string> = {
  // HVAC
  'C-20': 'HVAC',           // Warm-Air Heating, Ventilating and Air-Conditioning
  'C20': 'HVAC',
  'C-38': 'HVAC',           // Refrigeration
  'C38': 'HVAC',
  // Plumbing
  'C-36': 'Plumbing',       // Plumbing
  'C36': 'Plumbing',
  // Electrical
  'C-10': 'Electrical',     // Electrical
  'C10': 'Electrical',
  'C-46': 'Electrical',     // Solar (related to electrical)
  'C46': 'Electrical',
}

interface CSLBRecord {
  // License Master fields from CSLB CSV
  LICENSE_NUMBER: string
  BUSINESS_NAME: string
  ADDRESS: string
  ADDRESS2?: string
  CITY: string
  STATE: string
  ZIP: string
  PHONE?: string
  ISSUE_DATE: string
  EXPIRE_DATE: string
  LICENSE_STATUS: string
  PRIMARY_CLASSIFICATION: string
  ALL_CLASSIFICATIONS?: string
  // Personnel file fields (may be joined)
  PERSONNEL_NAME?: string
  PERSONNEL_TITLE?: string
}

/**
 * Import CA CSLB contractor license data into license_records staging table
 *
 * Expected POST body:
 * {
 *   records: CSLBRecord[],  // Array of parsed CSV records
 *   limit?: number,         // Optional limit (default 500)
 *   tradeFilter?: string[]  // Optional trade types to include (default: HVAC, Plumbing, Electrical)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      }, { status: 500 })
    }

    const body = await request.json()
    const {
      records,
      limit,  // No default limit - import all records unless specified
      tradeFilter = ['HVAC', 'Plumbing', 'Electrical', 'General']
    } = body

    if (!records || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, error: 'records array is required' },
        { status: 400 }
      )
    }

    console.log(`[CA CSLB Import] Starting import of ${records.length} records to license_records staging table`)
    console.log(`[CA CSLB Import] Trade filter: ${tradeFilter.join(', ')}`)
    console.log(`[CA CSLB Import] Limit: ${limit || 'none (import all)'}`)

    const results = {
      total: records.length,
      filtered: 0,
      imported: 0,
      skipped: 0,
      duplicates: 0,
      errors: [] as string[]
    }

    // Filter records by target classifications
    const filteredRecords = records.filter((record: CSLBRecord) => {
      const primaryClass = record.PRIMARY_CLASSIFICATION?.trim().toUpperCase()
      const allClasses = record.ALL_CLASSIFICATIONS?.trim().toUpperCase() || ''

      // Check if any of the classifications match our targets
      for (const [code, trade] of Object.entries(TARGET_CLASSIFICATIONS)) {
        if (tradeFilter.includes(trade)) {
          if (primaryClass?.includes(code) || allClasses.includes(code)) {
            return true
          }
        }
      }
      return false
    })

    results.filtered = filteredRecords.length
    console.log(`[CA CSLB Import] Filtered to ${filteredRecords.length} matching records`)

    // Apply limit if specified
    const recordsToProcess = limit ? filteredRecords.slice(0, limit) : filteredRecords
    console.log(`[CA CSLB Import] Processing ${recordsToProcess.length} records${limit ? ` (limited to ${limit})` : ''}`)

    // Get existing license numbers from staging table
    const licenseNumbers = recordsToProcess
      .map((r: CSLBRecord) => r.LICENSE_NUMBER)
      .filter(Boolean)

    const { data: existingRecords } = await supabase
      .from('license_records')
      .select('license_number')
      .eq('source', 'cslb')
      .in('license_number', licenseNumbers)

    const existingLicenses = new Set(existingRecords?.map(l => l.license_number) || [])

    // Track license numbers we've seen in this batch to avoid duplicates within the import
    const seenInBatch = new Set<string>()

    // Process each record
    const recordsToInsert = []

    for (const record of recordsToProcess) {
      try {
        // Skip if already exists in staging table
        if (existingLicenses.has(record.LICENSE_NUMBER)) {
          results.duplicates++
          continue
        }

        // Skip if we've already seen this license number in this batch
        if (seenInBatch.has(record.LICENSE_NUMBER)) {
          results.duplicates++
          continue
        }
        seenInBatch.add(record.LICENSE_NUMBER)

        // Skip only if explicitly inactive (allow empty/missing status)
        const status = record.LICENSE_STATUS?.toUpperCase()?.trim()
        if (status && (status === 'INACTIVE' || status === 'EXPIRED' || status === 'REVOKED' || status === 'SUSPENDED' || status === 'CANCELLED')) {
          results.skipped++
          continue
        }

        // Determine trade type from classification
        const primaryClass = record.PRIMARY_CLASSIFICATION?.trim().toUpperCase() || ''
        let tradeType = 'General'
        for (const [code, trade] of Object.entries(TARGET_CLASSIFICATIONS)) {
          if (primaryClass.includes(code)) {
            tradeType = trade
            break
          }
        }

        // Build full address
        const addressParts = [
          record.ADDRESS,
          record.ADDRESS2,
          record.CITY,
          record.STATE,
          record.ZIP
        ].filter(Boolean)
        const fullAddress = addressParts.join(', ')

        // Parse expiration date
        let expirationDate = null
        if (record.EXPIRE_DATE) {
          try {
            expirationDate = new Date(record.EXPIRE_DATE).toISOString().split('T')[0]
          } catch (e) {
            // Invalid date format
          }
        }

        // Create staging record for license_records table
        const stagingRecord = {
          // Source tracking
          source: 'cslb',
          license_number: record.LICENSE_NUMBER,
          license_status: record.LICENSE_STATUS?.toLowerCase() || 'active',
          license_classification: record.PRIMARY_CLASSIFICATION,
          license_expiration: expirationDate,

          // Business info
          business_name: record.BUSINESS_NAME,
          full_name: record.PERSONNEL_NAME || record.BUSINESS_NAME,
          first_name: record.PERSONNEL_NAME?.split(' ')[0] || null,
          last_name: record.PERSONNEL_NAME?.split(' ').slice(1).join(' ') || null,
          job_title: record.PERSONNEL_TITLE || 'Contractor',

          // Contact
          phone: record.PHONE || null,
          address: fullAddress,
          city: record.CITY || null,
          state: 'CA',
          zip: record.ZIP || null,

          // Computed fields
          trade_type: tradeType,

          // AI selection tracking (default values)
          ai_selected: false,
          ai_score: null,
          ai_selection_reason: null,
          selected_for_job_id: null,

          // Verification tracking (default values)
          email: null,
          email_verified: false,
          email_verification_date: null,
          hunter_confidence: null,

          // Movement tracking (default values)
          moved_to_cold_leads: false,
          cold_lead_id: null,

          // Timestamps
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        recordsToInsert.push(stagingRecord)
      } catch (error) {
        results.errors.push(`${record.LICENSE_NUMBER}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Batch insert into license_records staging table
    if (recordsToInsert.length > 0) {
      console.log(`[CA CSLB Import] Inserting ${recordsToInsert.length} records into license_records staging table`)

      // Insert in batches of 100
      const batchSize = 100
      for (let i = 0; i < recordsToInsert.length; i += batchSize) {
        const batch = recordsToInsert.slice(i, i + batchSize)
        const { error: insertError, count } = await supabase
          .from('license_records')
          .upsert(batch, {
            onConflict: 'source,license_number',
            ignoreDuplicates: true
          })

        if (insertError) {
          console.error(`[CA CSLB Import] Batch insert error:`, insertError)
          results.errors.push(`Batch ${i / batchSize}: ${insertError.message}`)
        } else {
          results.imported += batch.length
        }
      }
    }

    console.log(`[CA CSLB Import] Complete: ${results.imported} imported to staging, ${results.duplicates} duplicates, ${results.skipped} skipped`)

    return NextResponse.json({
      success: true,
      results,
      message: `Imported ${results.imported} CA contractors to staging table (${results.duplicates} duplicates skipped)`
    })

  } catch (error) {
    console.error('[CA CSLB Import] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Get CA CSLB import stats from staging table
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
      }, { status: 500 })
    }

    // Count total CA records in staging
    const { count: totalCA } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'cslb')

    // Count by trade type using individual count queries (avoids row limit issues)
    const tradeCounts: Record<string, number> = {}
    const tradeTypes = ['HVAC', 'Plumbing', 'Electrical', 'General']

    for (const trade of tradeTypes) {
      const { count } = await supabase
        .from('license_records')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'cslb')
        .eq('trade_type', trade)

      if (count && count > 0) {
        tradeCounts[trade] = count
      }
    }

    // Count AI-selected records
    const { count: aiSelectedCount } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'cslb')
      .eq('ai_selected', true)

    // Count verified records (have email)
    const { count: verifiedCount } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'cslb')
      .eq('email_verified', true)

    // Count records moved to cold_leads
    const { count: movedCount } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'cslb')
      .eq('moved_to_cold_leads', true)

    // Count records pending selection (not yet AI selected)
    const { count: pendingSelection } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'cslb')
      .eq('ai_selected', false)

    return NextResponse.json({
      success: true,
      stats: {
        total: totalCA || 0,
        byTrade: tradeCounts,
        aiSelected: aiSelectedCount || 0,
        verified: verifiedCount || 0,
        movedToColdLeads: movedCount || 0,
        pendingSelection: pendingSelection || 0,
        source: 'California CSLB (Contractors State License Board)',
        table: 'license_records (staging)'
      }
    })
  } catch (error) {
    console.error('[CA CSLB Stats] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
