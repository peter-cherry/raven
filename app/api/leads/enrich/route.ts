import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const HUNTER_API_KEY = process.env.HUNTER_API_KEY

interface HunterEmailFinderResponse {
  data?: {
    first_name: string
    last_name: string
    email: string
    score: number
    domain: string
    position?: string
    twitter?: string
    linkedin_url?: string
    phone_number?: string
    company?: string
    sources?: Array<{
      domain: string
      uri: string
      extracted_on: string
    }>
    verification?: {
      date: string
      status: string
    }
  }
  meta?: {
    params: {
      first_name: string
      last_name: string
      domain?: string
      company?: string
    }
  }
  errors?: Array<{ id: string; code: number; details: string }>
}

interface HunterDomainSearchResponse {
  data?: {
    domain: string
    webmail: boolean
    pattern?: string
    emails?: Array<{
      value: string
      type: string
      confidence: number
      first_name?: string
      last_name?: string
      position?: string
    }>
  }
  meta?: {
    results: number
    limit: number
    offset: number
  }
  errors?: Array<{ id: string; code: number; details: string }>
}

/**
 * Enrich cold leads with email addresses via Hunter.io
 *
 * POST body options:
 * {
 *   leadIds?: string[],     // Specific lead IDs to enrich
 *   source?: string,        // Lead source to enrich (cslb, dbpr, etc.)
 *   limit?: number,         // Max leads to process (default 50)
 *   dryRun?: boolean        // If true, don't update database
 * }
 */
export async function POST(request: NextRequest) {
  try {
    if (!HUNTER_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'HUNTER_API_KEY not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      leadIds,
      source,
      limit = 50,
      dryRun = false
    } = body

    console.log(`[Hunter Enrich] Starting enrichment (limit: ${limit}, dryRun: ${dryRun})`)

    // Build query for leads needing enrichment
    let query = supabase
      .from('cold_leads')
      .select('id, full_name, first_name, last_name, company_name, city, state, website, lead_source, linkedin_url')
      .or('email.like.%@placeholder.cslb,email.like.%@placeholder.dbpr,email.is.null')
      .is('enriched_at', null)
      .limit(limit)

    if (leadIds && leadIds.length > 0) {
      query = query.in('id', leadIds)
    }

    if (source) {
      query = query.eq('lead_source', source)
    }

    const { data: leads, error: queryError } = await query

    if (queryError) {
      console.error('[Hunter Enrich] Query error:', queryError)
      return NextResponse.json(
        { success: false, error: queryError.message },
        { status: 500 }
      )
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        success: true,
        results: {
          processed: 0,
          enriched: 0,
          notFound: 0,
          errors: 0
        },
        message: 'No leads needing enrichment found'
      })
    }

    console.log(`[Hunter Enrich] Found ${leads.length} leads to enrich`)

    const results = {
      processed: 0,
      enriched: 0,
      notFound: 0,
      errors: 0,
      errorDetails: [] as string[]
    }

    for (const lead of leads) {
      try {
        results.processed++

        // Strategy 1: Try email finder with name + company
        let email = null
        let enrichmentData: any = {}

        if (lead.first_name && lead.last_name && lead.company_name) {
          const finderResult = await findEmailByName(
            lead.first_name,
            lead.last_name,
            lead.company_name
          )

          if (finderResult.email) {
            email = finderResult.email
            enrichmentData = {
              email: finderResult.email,
              email_verified: (finderResult.score ?? 0) >= 80,
              linkedin_url: finderResult.linkedin_url || lead.linkedin_url,
              phone: finderResult.phone_number || null,
              enriched_at: new Date().toISOString(),
              enrichment_source: 'hunter.io'
            }
          }
        }

        // Strategy 2: If we have a website, try domain search
        if (!email && lead.website) {
          const domain = extractDomain(lead.website)
          if (domain) {
            const domainResult = await searchDomainEmails(domain, lead.first_name, lead.last_name)
            if (domainResult.email) {
              email = domainResult.email
              enrichmentData = {
                email: domainResult.email,
                email_verified: (domainResult.confidence ?? 0) >= 80,
                enriched_at: new Date().toISOString(),
                enrichment_source: 'hunter.io'
              }
            }
          }
        }

        // Strategy 3: Try generic email pattern
        if (!email && lead.first_name && lead.last_name && lead.company_name) {
          const guessedEmail = generateEmailGuess(lead.first_name, lead.last_name, lead.company_name)
          if (guessedEmail) {
            const verified = await verifyEmail(guessedEmail)
            if (verified.status === 'valid' || verified.status === 'accept_all') {
              email = guessedEmail
              enrichmentData = {
                email: guessedEmail,
                email_verified: verified.status === 'valid',
                enriched_at: new Date().toISOString(),
                enrichment_source: 'hunter.io-guess'
              }
            }
          }
        }

        if (email && !dryRun) {
          // Update the lead with the found email
          const { error: updateError } = await supabase
            .from('cold_leads')
            .update(enrichmentData)
            .eq('id', lead.id)

          if (updateError) {
            console.error(`[Hunter Enrich] Update error for ${lead.id}:`, updateError)
            results.errors++
            results.errorDetails.push(`${lead.id}: Update failed - ${updateError.message}`)
          } else {
            results.enriched++
            console.log(`[Hunter Enrich] Enriched ${lead.full_name} -> ${email}`)
          }
        } else if (email && dryRun) {
          results.enriched++
          console.log(`[Hunter Enrich] [DRY RUN] Would enrich ${lead.full_name} -> ${email}`)
        } else {
          results.notFound++

          // Mark as attempted even if not found (to avoid retrying)
          if (!dryRun) {
            await supabase
              .from('cold_leads')
              .update({
                enriched_at: new Date().toISOString(),
                enrichment_source: 'hunter.io-not-found'
              })
              .eq('id', lead.id)
          }
        }

        // Rate limit - Hunter allows 25 requests/second on paid plans
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        results.errors++
        results.errorDetails.push(`${lead.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    console.log(`[Hunter Enrich] Complete: ${results.enriched} enriched, ${results.notFound} not found, ${results.errors} errors`)

    return NextResponse.json({
      success: true,
      results,
      message: `Enriched ${results.enriched}/${results.processed} leads`
    })

  } catch (error) {
    console.error('[Hunter Enrich] Error:', error)
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
    // Count leads needing enrichment by source
    const { data: needsEnrichment } = await supabase
      .from('cold_leads')
      .select('lead_source')
      .or('email.like.%@placeholder.cslb,email.like.%@placeholder.dbpr,email.is.null')
      .is('enriched_at', null)

    const needsBySource: Record<string, number> = {}
    needsEnrichment?.forEach(lead => {
      const source = lead.lead_source || 'unknown'
      needsBySource[source] = (needsBySource[source] || 0) + 1
    })

    // Count enriched leads by source
    const { data: enrichedLeads } = await supabase
      .from('cold_leads')
      .select('lead_source, enrichment_source')
      .not('enriched_at', 'is', null)

    const enrichedBySource: Record<string, number> = {}
    enrichedLeads?.forEach(lead => {
      const source = lead.lead_source || 'unknown'
      enrichedBySource[source] = (enrichedBySource[source] || 0) + 1
    })

    // Count enrichments this month (for quota tracking)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: enrichedThisMonth } = await supabase
      .from('cold_leads')
      .select('*', { count: 'exact', head: true })
      .gte('enriched_at', startOfMonth.toISOString())
      .eq('enrichment_source', 'hunter.io')

    // Count verified emails
    const { count: verifiedEmails } = await supabase
      .from('cold_leads')
      .select('*', { count: 'exact', head: true })
      .eq('email_verified', true)
      .in('lead_source', ['cslb', 'dbpr', 'wa_lni'])

    return NextResponse.json({
      success: true,
      stats: {
        needsEnrichment: needsBySource,
        enriched: enrichedBySource,
        enrichedThisMonth: enrichedThisMonth || 0,
        verifiedEmails: verifiedEmails || 0,
        hunterMonthlyLimit: 500 // Based on $49/mo plan
      }
    })
  } catch (error) {
    console.error('[Hunter Stats] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper functions

async function findEmailByName(
  firstName: string,
  lastName: string,
  company: string
): Promise<{ email?: string; score?: number; linkedin_url?: string; phone_number?: string }> {
  try {
    const url = new URL('https://api.hunter.io/v2/email-finder')
    url.searchParams.set('first_name', firstName)
    url.searchParams.set('last_name', lastName)
    url.searchParams.set('company', company)
    url.searchParams.set('api_key', HUNTER_API_KEY!)

    const response = await fetch(url.toString())
    const data: HunterEmailFinderResponse = await response.json()

    if (data.data?.email) {
      return {
        email: data.data.email,
        score: data.data.score,
        linkedin_url: data.data.linkedin_url,
        phone_number: data.data.phone_number
      }
    }

    return {}
  } catch (error) {
    console.error('[Hunter] Email finder error:', error)
    return {}
  }
}

async function searchDomainEmails(
  domain: string,
  firstName?: string | null,
  lastName?: string | null
): Promise<{ email?: string; confidence?: number }> {
  try {
    const url = new URL('https://api.hunter.io/v2/domain-search')
    url.searchParams.set('domain', domain)
    url.searchParams.set('api_key', HUNTER_API_KEY!)
    url.searchParams.set('limit', '10')

    const response = await fetch(url.toString())
    const data: HunterDomainSearchResponse = await response.json()

    if (data.data?.emails && data.data.emails.length > 0) {
      // Try to find matching name
      if (firstName && lastName) {
        const match = data.data.emails.find(e =>
          e.first_name?.toLowerCase() === firstName.toLowerCase() &&
          e.last_name?.toLowerCase() === lastName.toLowerCase()
        )
        if (match) {
          return { email: match.value, confidence: match.confidence }
        }
      }

      // Return highest confidence email
      const sorted = [...data.data.emails].sort((a, b) => b.confidence - a.confidence)
      return { email: sorted[0].value, confidence: sorted[0].confidence }
    }

    return {}
  } catch (error) {
    console.error('[Hunter] Domain search error:', error)
    return {}
  }
}

async function verifyEmail(email: string): Promise<{ status: string }> {
  try {
    const url = new URL('https://api.hunter.io/v2/email-verifier')
    url.searchParams.set('email', email)
    url.searchParams.set('api_key', HUNTER_API_KEY!)

    const response = await fetch(url.toString())
    const data = await response.json()

    return { status: data.data?.status || 'unknown' }
  } catch (error) {
    console.error('[Hunter] Email verify error:', error)
    return { status: 'error' }
  }
}

function extractDomain(website: string): string | null {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`)
    return url.hostname.replace('www.', '')
  } catch {
    return null
  }
}

function generateEmailGuess(firstName: string, lastName: string, company: string): string | null {
  // Clean up company name to create domain guess
  const cleanCompany = company
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(llc|inc|corp|co|company|contractors|services|hvac|plumbing|electrical)/g, '')
    .trim()

  if (!cleanCompany || cleanCompany.length < 3) return null

  // Common email patterns
  const firstLower = firstName.toLowerCase().replace(/[^a-z]/g, '')
  const lastLower = lastName.toLowerCase().replace(/[^a-z]/g, '')

  // Most common pattern: first.last@company.com
  return `${firstLower}.${lastLower}@${cleanCompany}.com`
}
