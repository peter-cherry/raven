/**
 * AI-powered lead selection module for contractor matching
 * Uses OpenAI to intelligently rank contractors based on geographic proximity and trade specialization
 */

import { fetchWithRetry } from './retryWithBackoff'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export interface LicenseRecord {
  id: string
  source: string
  license_number: string
  license_status: string | null
  license_classification: string | null
  license_expiration: string | null
  business_name: string | null
  full_name: string | null
  first_name: string | null
  last_name: string | null
  job_title: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  trade_type: string | null
  lat: number | null
  lng: number | null
}

export interface SelectionCriteria {
  jobCity: string
  jobState: string
  jobLat?: number
  jobLng?: number
  tradeNeeded: string  // 'HVAC', 'Plumbing', 'Electrical'
  limit: number
}

export interface SelectedContractor {
  id: string
  score: number
  reason: string
  contractor: LicenseRecord
}

export interface SelectionResult {
  success: boolean
  selected: SelectedContractor[]
  totalCandidates: number
  error?: string
}

/**
 * Calculate distance between two lat/lng points using Haversine formula
 * Returns distance in miles
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Pre-filter contractors based on basic criteria before sending to AI
 * This reduces the number of records sent to OpenAI
 */
function preFilterContractors(
  contractors: LicenseRecord[],
  criteria: SelectionCriteria
): LicenseRecord[] {
  return contractors.filter(contractor => {
    // Must have a city
    if (!contractor.city) return false

    // Must match trade type (or be 'General' which can do anything)
    if (contractor.trade_type !== criteria.tradeNeeded && contractor.trade_type !== 'General') {
      return false
    }

    // Prefer same state
    if (contractor.state !== criteria.jobState) {
      return false
    }

    // Skip if explicitly expired or inactive
    const status = contractor.license_status?.toLowerCase()
    if (status && (status === 'expired' || status === 'inactive' || status === 'revoked')) {
      return false
    }

    return true
  })
}

/**
 * Score contractors based on simple heuristics (fallback when AI is unavailable)
 */
function scoreContractorsHeuristic(
  contractors: LicenseRecord[],
  criteria: SelectionCriteria,
  limit: number
): SelectedContractor[] {
  const scored = contractors.map(contractor => {
    let score = 50 // Base score

    // Trade match bonus (exact match is best)
    if (contractor.trade_type === criteria.tradeNeeded) {
      score += 30
    } else if (contractor.trade_type === 'General') {
      score += 10
    }

    // City match bonus
    if (contractor.city?.toLowerCase() === criteria.jobCity.toLowerCase()) {
      score += 20
    }

    // Active license bonus
    if (contractor.license_status?.toLowerCase() === 'active') {
      score += 10
    }

    // Has phone number bonus (more likely to be reachable)
    if (contractor.phone) {
      score += 5
    }

    // Distance penalty (if lat/lng available)
    if (criteria.jobLat && criteria.jobLng && contractor.lat && contractor.lng) {
      const distance = calculateDistance(
        criteria.jobLat,
        criteria.jobLng,
        contractor.lat,
        contractor.lng
      )
      // Penalize for distance (max 20 point penalty at 50+ miles)
      score -= Math.min(20, distance / 2.5)
    }

    return {
      id: contractor.id,
      score: Math.max(0, Math.min(100, Math.round(score))),
      reason: `Trade: ${contractor.trade_type}, City: ${contractor.city}, Status: ${contractor.license_status || 'unknown'}`,
      contractor
    }
  })

  // Sort by score descending and take top N
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Use OpenAI to intelligently rank contractors for a job
 */
async function scoreContractorsWithAI(
  contractors: LicenseRecord[],
  criteria: SelectionCriteria,
  limit: number
): Promise<SelectedContractor[]> {
  // Prepare contractor list for AI (limit context size)
  const contractorSummaries = contractors.slice(0, 50).map((c, idx) => ({
    idx,
    id: c.id,
    name: c.full_name || c.business_name || 'Unknown',
    trade: c.trade_type || 'Unknown',
    city: c.city || 'Unknown',
    state: c.state || 'Unknown',
    license_status: c.license_status || 'unknown',
    classification: c.license_classification || 'Unknown'
  }))

  const systemPrompt = `You are a contractor selection assistant. Your task is to rank contractors by suitability for a job.

RANKING CRITERIA (in order of importance):
1. Geographic proximity - Same city is best, nearby cities are good
2. Trade match - Exact trade match is best (e.g., HVAC for HVAC job)
3. License status - Active licenses preferred over unknown
4. Classification - More specific classifications indicate specialization

OUTPUT FORMAT (JSON only):
{
  "selected": [
    {"idx": 0, "score": 95, "reason": "Same city, exact trade match, active license"},
    {"idx": 5, "score": 82, "reason": "Nearby city, trade match"},
    ...
  ]
}

Select up to ${limit} contractors. Score from 0-100. Higher is better.`

  const userPrompt = `Select the best contractors for this job:

JOB DETAILS:
- Location: ${criteria.jobCity}, ${criteria.jobState}
- Trade Needed: ${criteria.tradeNeeded}

AVAILABLE CONTRACTORS:
${JSON.stringify(contractorSummaries, null, 2)}

Return the top ${limit} contractors ranked by suitability.`

  try {
    const response = await fetchWithRetry(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      },
      { maxRetries: 2, initialDelayMs: 1000 }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[AI Lead Selector] API error:', response.status, errorText)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content in AI response')
    }

    // Parse JSON response
    const parsed = JSON.parse(content)

    if (!parsed.selected || !Array.isArray(parsed.selected)) {
      throw new Error('Invalid AI response format')
    }

    // Map AI results back to full contractor records
    const selected: SelectedContractor[] = []
    for (const item of parsed.selected) {
      const contractor = contractors[item.idx]
      if (contractor) {
        selected.push({
          id: contractor.id,
          score: item.score || 50,
          reason: item.reason || 'AI selected',
          contractor
        })
      }
    }

    return selected.slice(0, limit)

  } catch (error) {
    console.error('[AI Lead Selector] AI scoring failed, using heuristic fallback:', error)
    // Fallback to heuristic scoring
    return scoreContractorsHeuristic(contractors, criteria, limit)
  }
}

/**
 * Main function: Select contractors from staging table for a job
 */
export async function selectContractors(
  contractors: LicenseRecord[],
  criteria: SelectionCriteria
): Promise<SelectionResult> {
  console.log(`[AI Lead Selector] Starting selection for ${criteria.tradeNeeded} job in ${criteria.jobCity}, ${criteria.jobState}`)
  console.log(`[AI Lead Selector] Total candidates: ${contractors.length}, limit: ${criteria.limit}`)

  if (contractors.length === 0) {
    return {
      success: false,
      selected: [],
      totalCandidates: 0,
      error: 'No contractors provided'
    }
  }

  // Pre-filter to reduce candidates
  const filtered = preFilterContractors(contractors, criteria)
  console.log(`[AI Lead Selector] After pre-filter: ${filtered.length} candidates`)

  if (filtered.length === 0) {
    return {
      success: false,
      selected: [],
      totalCandidates: contractors.length,
      error: `No contractors match criteria (trade: ${criteria.tradeNeeded}, state: ${criteria.jobState})`
    }
  }

  // Score and rank contractors
  let selected: SelectedContractor[]

  if (OPENAI_API_KEY && filtered.length > 5) {
    // Use AI for larger candidate pools
    console.log('[AI Lead Selector] Using AI scoring')
    selected = await scoreContractorsWithAI(filtered, criteria, criteria.limit)
  } else {
    // Use heuristic for small pools or when AI unavailable
    console.log('[AI Lead Selector] Using heuristic scoring')
    selected = scoreContractorsHeuristic(filtered, criteria, criteria.limit)
  }

  console.log(`[AI Lead Selector] Selected ${selected.length} contractors`)

  return {
    success: true,
    selected,
    totalCandidates: contractors.length
  }
}

/**
 * Format selection reason for display
 */
export function formatSelectionReason(selected: SelectedContractor): string {
  const c = selected.contractor
  return `Score ${selected.score}/100 - ${c.trade_type} contractor in ${c.city}, ${c.state}. ${selected.reason}`
}
