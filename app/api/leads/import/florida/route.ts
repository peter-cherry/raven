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

// FL DBPR Occupation text patterns we're interested in
// The file uses abbreviated text like "Certified AC", "Certified Plui", etc.
const TARGET_OCCUPATION_PATTERNS: Record<string, string> = {
  // HVAC related - FL uses "Certified AC" for Air Conditioning
  'CERTIFIED AC': 'HVAC',
  'AIR CONDITIONING': 'HVAC',
  'HVAC': 'HVAC',
  'MECHANICAL': 'HVAC',
  'HEATING': 'HVAC',
  // Plumbing - FL uses "Certified Plui" or "Certified Plum"
  'CERTIFIED PLU': 'Plumbing',
  'PLUMBING': 'Plumbing',
  'PLUMBER': 'Plumbing',
  // Electrical - FL uses "Certified Elec"
  'CERTIFIED ELEC': 'Electrical',
  'ELECTRICAL': 'Electrical',
  'ELECTRICIAN': 'Electrical',
  // General (may do HVAC/Plumbing/Electrical)
  'CERTIFIED GEN': 'General',
  'CERTIFIED BUI': 'General',
  'GENERAL CONTRACTOR': 'General',
  'BUILDING CONTRACTOR': 'General',
}

interface DBPRRecord {
  // DBPR Construction Licensee fields - mapped from frontend CSV parser
  LICENSE_NUMBER: string
  OCCUPATION_CODE: string
  FIRST_NAME?: string
  MIDDLE_NAME?: string
  LAST_NAME?: string
  ADDRESS_1?: string
  ADDRESS_2?: string
  CITY?: string
  STATE?: string
  ZIP?: string
  PHONE?: string
  LICENSE_STATUS?: string
}

/**
 * Import FL DBPR contractor license data into license_records staging table
 *
 * Expected POST body:
 * {
 *   records: DBPRRecord[],  // Array of parsed CSV records
 *   limit?: number,         // Optional limit (default 500)
 *   tradeFilter?: string[]  // Optional trade types to include
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

    console.log(`[FL DBPR Import] Starting import of ${records.length} records to license_records staging table`)
    console.log(`[FL DBPR Import] Trade filter: ${tradeFilter.join(', ')}`)
    console.log(`[FL DBPR Import] Limit: ${limit || 'none (import all)'}`)

    const results = {
      total: records.length,
      filtered: 0,
      imported: 0,
      skipped: 0,
      duplicates: 0,
      errors: [] as string[]
    }

    // Filter records by target occupation text patterns
    const filteredRecords = records.filter((record: DBPRRecord) => {
      const occText = record.OCCUPATION_CODE?.trim().toUpperCase() || ''

      for (const [pattern, trade] of Object.entries(TARGET_OCCUPATION_PATTERNS)) {
        if (tradeFilter.includes(trade)) {
          if (occText.includes(pattern)) {
            return true
          }
        }
      }
      return false
    })

    results.filtered = filteredRecords.length
    console.log(`[FL DBPR Import] Filtered to ${filteredRecords.length} matching records`)

    // Apply limit if specified
    const recordsToProcess = limit ? filteredRecords.slice(0, limit) : filteredRecords
    console.log(`[FL DBPR Import] Processing ${recordsToProcess.length} records${limit ? ` (limited to ${limit})` : ''}`)

    // Get existing license numbers from staging table
    const licenseNumbers = recordsToProcess
      .map((r: DBPRRecord) => r.LICENSE_NUMBER)
      .filter(Boolean)

    const { data: existingRecords } = await supabase
      .from('license_records')
      .select('license_number')
      .eq('source', 'dbpr')
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

        // Skip if explicitly inactive (but allow if status is empty/missing)
        const status = record.LICENSE_STATUS?.toUpperCase()?.trim()
        if (status && (status === 'I' || status === 'INACTIVE' || status.includes('INACTIVE') || status.includes('REVOKED'))) {
          results.skipped++
          continue
        }

        // Determine trade type from occupation text
        const occText = record.OCCUPATION_CODE?.trim().toUpperCase() || ''
        let tradeType = 'General'
        for (const [pattern, trade] of Object.entries(TARGET_OCCUPATION_PATTERNS)) {
          if (occText.includes(pattern)) {
            tradeType = trade
            break
          }
        }

        // Build full address
        const addressParts = [
          record.ADDRESS_1,
          record.ADDRESS_2,
          record.CITY,
          record.STATE || 'FL',
          record.ZIP
        ].filter(Boolean)
        const fullAddress = addressParts.join(', ')

        // Use separate name columns from the file
        const firstName = record.FIRST_NAME?.trim() || null
        const middleName = record.MIDDLE_NAME?.trim() || ''
        const lastName = record.LAST_NAME?.trim() || null
        const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ')

        // Create staging record for license_records table
        const stagingRecord = {
          // Source tracking
          source: 'dbpr',
          license_number: record.LICENSE_NUMBER,
          license_status: record.LICENSE_STATUS?.toLowerCase() || 'active',
          license_classification: record.OCCUPATION_CODE,
          license_expiration: null,  // Not available in FL file format

          // Business info
          business_name: fullName,  // Use full name as business for individual contractors
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          job_title: record.OCCUPATION_CODE || 'Contractor',

          // Contact
          phone: record.PHONE || null,
          address: fullAddress,
          city: record.CITY || null,
          state: 'FL',
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
      console.log(`[FL DBPR Import] Inserting ${recordsToInsert.length} records into license_records staging table`)

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
          console.error(`[FL DBPR Import] Batch insert error:`, insertError)
          results.errors.push(`Batch ${i / batchSize}: ${insertError.message}`)
        } else {
          results.imported += batch.length
        }
      }
    }

    console.log(`[FL DBPR Import] Complete: ${results.imported} imported to staging, ${results.duplicates} duplicates, ${results.skipped} skipped`)

    return NextResponse.json({
      success: true,
      results,
      message: `Imported ${results.imported} FL contractors to staging table (${results.duplicates} duplicates skipped)`
    })

  } catch (error) {
    console.error('[FL DBPR Import] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Get FL DBPR import stats from staging table
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

    // Count total FL records in staging
    const { count: totalFL } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'dbpr')

    // Count by trade type using individual count queries (avoids row limit issues)
    const tradeCounts: Record<string, number> = {}
    const tradeTypes = ['HVAC', 'Plumbing', 'Electrical', 'General']

    for (const trade of tradeTypes) {
      const { count } = await supabase
        .from('license_records')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'dbpr')
        .eq('trade_type', trade)

      if (count && count > 0) {
        tradeCounts[trade] = count
      }
    }

    // Count AI-selected records
    const { count: aiSelectedCount } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'dbpr')
      .eq('ai_selected', true)

    // Count verified records (have email)
    const { count: verifiedCount } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'dbpr')
      .eq('email_verified', true)

    // Count records moved to cold_leads
    const { count: movedCount } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'dbpr')
      .eq('moved_to_cold_leads', true)

    // Count records pending selection (not yet AI selected)
    const { count: pendingSelection } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'dbpr')
      .eq('ai_selected', false)

    return NextResponse.json({
      success: true,
      stats: {
        total: totalFL || 0,
        byTrade: tradeCounts,
        aiSelected: aiSelectedCount || 0,
        verified: verifiedCount || 0,
        movedToColdLeads: movedCount || 0,
        pendingSelection: pendingSelection || 0,
        source: 'Florida DBPR (Department of Business and Professional Regulation)',
        table: 'license_records (staging)'
      }
    })
  } catch (error) {
    console.error('[FL DBPR Stats] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
