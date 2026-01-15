import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { findEmail, verifyEmail, getAccountInfo } from '@/lib/hunter-verification'

// Check if we should use mock mode
function shouldUseMockMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
  return mockMode || !url || !serviceKey
}

// Initialize Supabase admin client lazily to handle missing env vars
function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    return null
  }
  
  return createClient(url, serviceKey)
}

/**
 * Verify contractor emails using Hunter.io
 *
 * POST /api/leads/verify
 *
 * Request body:
 * {
 *   ids?: string[],         // Specific record IDs to verify (optional)
 *   limit?: number,         // Max records to process (default 10)
 *   minConfidence?: number  // Minimum confidence threshold (default 70)
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   verified: number,
 *   failed: number,
 *   results: VerificationResultItem[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Mock mode - return fake verification results
    if (shouldUseMockMode()) {
      console.log('[Email Verify] Mock mode: returning fake results')
      return NextResponse.json({
        success: true,
        verified: 0,
        failed: 0,
        results: [],
        message: 'Mock mode - no actual verification performed',
        mock: true
      })
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
      }, { status: 500 })
    }

    const body = await request.json()
    const {
      ids = null,
      limit = 10,
      minConfidence = 70
    } = body

    console.log(`[Email Verify] Starting verification, limit: ${limit}, minConfidence: ${minConfidence}`)

    // Check Hunter.io account status first
    const accountInfo = await getAccountInfo()
    if (!accountInfo.success) {
      return NextResponse.json({
        success: false,
        error: accountInfo.error || 'Failed to check Hunter.io account status'
      }, { status: 500 })
    }

    const availableSearches = accountInfo.searches?.available || 0
    if (availableSearches < limit) {
      console.warn(`[Email Verify] Low Hunter.io credits: ${availableSearches} available`)
      if (availableSearches === 0) {
        return NextResponse.json({
          success: false,
          error: 'No Hunter.io credits available',
          accountInfo
        }, { status: 429 })
      }
    }

    // Query records to verify
    let query = supabase
      .from('license_records')
      .select('*')

    if (ids && ids.length > 0) {
      // When specific IDs provided, only filter by those IDs and not yet verified
      query = query.in('id', ids).eq('email_verified', false)
    } else {
      // When no IDs provided, get unverified records without email
      query = query.eq('email_verified', false).is('email', null)
    }

    const { data: records, error: queryError } = await query.limit(Math.min(limit, availableSearches))

    if (queryError) {
      console.error('[Email Verify] Query error:', queryError)
      return NextResponse.json({
        success: false,
        error: `Database query failed: ${queryError.message}`
      }, { status: 500 })
    }

    if (!records || records.length === 0) {
      return NextResponse.json({
        success: true,
        verified: 0,
        failed: 0,
        results: [],
        message: 'No records need verification'
      })
    }

    console.log(`[Email Verify] Processing ${records.length} records`)

    const results: Array<{
      id: string
      businessName: string | null
      email: string | null
      confidence: number
      status: 'found' | 'not_found' | 'error'
      error?: string
    }> = []

    let verified = 0
    let failed = 0

    // Process each record
    for (const record of records) {
      const result = await findEmail({
        firstName: record.first_name || undefined,
        lastName: record.last_name || undefined,
        fullName: record.full_name || undefined,
        company: record.business_name || undefined
      })

      const now = new Date().toISOString()

      if (result.success && result.email && result.confidence >= minConfidence) {
        // Found email with sufficient confidence
        const { error: updateError } = await supabase
          .from('license_records')
          .update({
            email: result.email,
            email_verified: true,
            email_verification_date: now,
            hunter_confidence: result.confidence,
            updated_at: now
          })
          .eq('id', record.id)

        if (updateError) {
          console.error(`[Email Verify] Update error for ${record.id}:`, updateError)
        }

        verified++
        results.push({
          id: record.id,
          businessName: record.business_name,
          email: result.email,
          confidence: result.confidence,
          status: 'found'
        })

        console.log(`[Email Verify] Found: ${result.email} (${result.confidence}%) for ${record.business_name}`)
      } else {
        // Failed to find email or low confidence
        const { error: updateError } = await supabase
          .from('license_records')
          .update({
            email: result.email || null,  // Store even low-confidence emails
            email_verified: false,
            email_verification_date: now,
            hunter_confidence: result.confidence,
            updated_at: now
          })
          .eq('id', record.id)

        if (updateError) {
          console.error(`[Email Verify] Update error for ${record.id}:`, updateError)
        }

        failed++
        results.push({
          id: record.id,
          businessName: record.business_name,
          email: result.email,
          confidence: result.confidence,
          status: result.email ? 'found' : 'not_found',
          error: result.error
        })

        console.log(`[Email Verify] Failed: ${record.business_name} - ${result.error || 'low confidence'}`)
      }

      // Rate limit: wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`[Email Verify] Complete: ${verified} verified, ${failed} failed`)

    return NextResponse.json({
      success: true,
      verified,
      failed,
      results,
      message: `Verified ${verified} emails, ${failed} failed`,
      accountInfo: {
        searchesRemaining: (accountInfo.searches?.available || 0) - records.length
      }
    })

  } catch (error) {
    console.error('[Email Verify] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get verification stats and Hunter.io account info
 */
export async function GET() {
  try {
    // Mock mode - return fake stats
    if (shouldUseMockMode()) {
      return NextResponse.json({
        success: true,
        stats: {
          pendingVerification: 25,
          verified: 10,
          attempted: 35,
          lowConfidence: 5,
          averageConfidence: 82
        },
        hunterAccount: {
          searchesUsed: 50,
          searchesAvailable: 450,
          verificationsUsed: 20,
          verificationsAvailable: 480
        },
        mock: true
      })
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
      }, { status: 500 })
    }

    // Count records by verification status
    const { count: pendingVerification } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('ai_selected', true)
      .eq('email_verified', false)
      .is('email', null)

    const { count: verified } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('email_verified', true)

    const { count: attempted } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('ai_selected', true)
      .not('email_verification_date', 'is', null)

    const { count: lowConfidence } = await supabase
      .from('license_records')
      .select('*', { count: 'exact', head: true })
      .eq('ai_selected', true)
      .eq('email_verified', false)
      .not('email', 'is', null)

    // Get Hunter.io account info
    const accountInfo = await getAccountInfo()

    // Get average confidence of verified emails
    const { data: verifiedRecords } = await supabase
      .from('license_records')
      .select('hunter_confidence')
      .eq('email_verified', true)
      .not('hunter_confidence', 'is', null)

    let avgConfidence = 0
    if (verifiedRecords && verifiedRecords.length > 0) {
      const totalConfidence = verifiedRecords.reduce((sum, r) => sum + (r.hunter_confidence || 0), 0)
      avgConfidence = Math.round(totalConfidence / verifiedRecords.length)
    }

    return NextResponse.json({
      success: true,
      stats: {
        pendingVerification: pendingVerification || 0,
        verified: verified || 0,
        attempted: attempted || 0,
        lowConfidence: lowConfidence || 0,
        averageConfidence: avgConfidence
      },
      hunterAccount: accountInfo.success ? {
        searchesUsed: accountInfo.searches?.used || 0,
        searchesAvailable: accountInfo.searches?.available || 0,
        verificationsUsed: accountInfo.verifications?.used || 0,
        verificationsAvailable: accountInfo.verifications?.available || 0
      } : null,
      error: accountInfo.error
    })
  } catch (error) {
    console.error('[Email Verify Stats] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
