/**
 * Apify Google Maps Scraper Integration
 *
 * Replaces broken scrape-with-playwright Edge Function with working Apify integration.
 * Uses compass/crawler-google-places actor for reliable business data.
 *
 * Cost: ~$4 per 1,000 results
 */

import { ApifyClient } from 'apify-client'

// Initialize Apify client with token from environment
const getApifyClient = () => {
  const token = process.env.APIFY_TOKEN
  if (!token) {
    console.warn('[Apify] No APIFY_TOKEN found in environment variables')
  }
  return new ApifyClient({ token })
}

export interface ScrapeParams {
  trade: string
  city: string
  state: string
  maxResults?: number
}

export interface ScrapedBusiness {
  title: string
  address: string
  phone: string | null
  website: string | null
  totalScore: number | null
  reviewsCount: number
  categoryName: string
  location: { lat: number; lng: number } | null
  placeId: string
}

/**
 * Scrape Google Maps for contractors using Apify's Google Places actor
 *
 * @param params - Search parameters (trade, city, state, maxResults)
 * @returns Array of scraped business data
 */
export async function scrapeGoogleMaps(params: ScrapeParams): Promise<ScrapedBusiness[]> {
  const apify = getApifyClient()

  // Build search query
  const searchQuery = `${params.trade} contractor ${params.city} ${params.state}`
  console.log(`[Apify] Starting scrape for: "${searchQuery}"`)

  try {
    // Run the Google Places actor
    const run = await apify.actor('compass/crawler-google-places').call({
      searchStringsArray: [searchQuery],
      maxCrawledPlacesPerSearch: params.maxResults || 50,
      language: 'en',
      includeWebResults: false,
      maxImages: 0, // We don't need images
    })

    console.log(`[Apify] Actor run completed. Run ID: ${run.id}`)

    // Get results from the dataset
    const { items } = await apify.dataset(run.defaultDatasetId).listItems()

    console.log(`[Apify] Retrieved ${items.length} businesses`)

    // Map Apify response to our interface
    const businesses: ScrapedBusiness[] = items.map((item: any) => ({
      title: item.title || item.name || 'Unknown Business',
      address: item.address || item.street || '',
      phone: item.phone || item.phoneUnformatted || null,
      website: item.website || item.url || null,
      totalScore: item.totalScore || item.rating || null,
      reviewsCount: item.reviewsCount || item.reviews || 0,
      categoryName: item.categoryName || item.category || params.trade,
      location: item.location ? {
        lat: item.location.lat,
        lng: item.location.lng
      } : null,
      placeId: item.placeId || item.cid || `apify-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    }))

    return businesses
  } catch (error) {
    console.error('[Apify] Scrape failed:', error)
    throw error
  }
}

/**
 * Estimate cost for a scrape operation
 *
 * @param resultCount - Number of expected results
 * @returns Estimated cost in USD
 */
export function estimateScrapeCost(resultCount: number): number {
  // Apify Google Maps: ~$4 per 1,000 results
  return (resultCount / 1000) * 4
}
