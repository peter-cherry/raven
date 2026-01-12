import { NextRequest, NextResponse } from 'next/server'
import { scrapeGoogleMaps, ScrapedBusiness } from '@/lib/apifyClient'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface OutreachTarget {
  source_table: string
  source_id: string
  business_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  city: string
  state: string
  address: string | null
  trade_type: string
  email_found: boolean
  email_verified: boolean
  status: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trade, city, state, maxResults = 50 } = body

    // Validate required fields
    if (!trade || !city || !state) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: trade, city, state' },
        { status: 400 }
      )
    }

    console.log(`[Scrape API] Starting scrape for ${trade} in ${city}, ${state}`)

    // 1. Call Apify to scrape Google Maps
    const businesses = await scrapeGoogleMaps({
      trade,
      city,
      state,
      maxResults
    })

    if (businesses.length === 0) {
      return NextResponse.json({
        success: true,
        inserted: 0,
        duplicates: 0,
        message: 'No businesses found'
      })
    }

    console.log(`[Scrape API] Found ${businesses.length} businesses`)

    // 2. Transform to outreach_targets schema
    const targets: OutreachTarget[] = businesses.map((b: ScrapedBusiness) => ({
      source_table: 'apify_gmaps',
      source_id: b.placeId,
      business_name: b.title,
      contact_name: null, // Will be enriched later by Hunter
      email: null, // Will be enriched later by Hunter
      phone: b.phone,
      website: b.website,
      city: city,
      state: state,
      address: b.address,
      trade_type: trade,
      email_found: false,
      email_verified: false,
      status: 'pending'
    }))

    // 3. Upsert to database (skip duplicates by source_id)
    // Note: The 20251017 migration has UNIQUE(source_id, campaign_id)
    // Since we're not using campaign_id here, we'll use insert with on conflict
    const { data, error } = await supabase
      .from('outreach_targets')
      .upsert(targets, {
        onConflict: 'source_id',
        ignoreDuplicates: false
      })
      .select('id')

    if (error) {
      console.error('[Scrape API] Database error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const insertedCount = data?.length || 0
    const duplicateCount = businesses.length - insertedCount

    console.log(`[Scrape API] Inserted ${insertedCount}, skipped ${duplicateCount} duplicates`)

    // 4. Queue newly inserted targets for email enrichment
    if (data && data.length > 0) {
      const enrichmentQueue = data.map(t => ({
        target_id: t.id,
        domain: null, // Will be extracted from website in enrich-emails function
        status: 'pending'
      }))

      // Filter out targets that already have websites to extract domain
      const targetsWithWebsites = targets.filter(t => t.website)

      // Insert into enrichment queue
      const { error: queueError } = await supabase
        .from('email_enrichment_queue')
        .upsert(
          data.map((t, idx) => ({
            target_id: t.id,
            domain: extractDomain(targets[idx]?.website),
            status: 'pending'
          })).filter(q => q.domain), // Only queue targets with valid domains
          { onConflict: 'target_id', ignoreDuplicates: true }
        )

      if (queueError) {
        console.warn('[Scrape API] Failed to queue for enrichment:', queueError)
        // Don't fail the request, just log the warning
      } else {
        console.log(`[Scrape API] Queued ${data.length} targets for email enrichment`)
      }
    }

    // 5. Log scraping activity
    await supabase.from('scraping_activity').insert({
      source: 'apify_gmaps',
      trade: trade,
      state: state,
      query: `${trade} contractor ${city} ${state}`,
      results_found: businesses.length,
      new_targets: insertedCount,
      duplicate_targets: duplicateCount,
      status: 'completed',
      completed_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      duplicates: duplicateCount,
      total_found: businesses.length
    })
  } catch (error) {
    console.error('[Scrape API] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Extract domain from a website URL
 */
function extractDomain(website: string | null): string | null {
  if (!website) return null

  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`)
    return url.hostname.replace('www.', '')
  } catch {
    return null
  }
}
