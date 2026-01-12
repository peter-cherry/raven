/**
 * Hunter.io Email Verification Module
 * Uses Hunter.io API to find and verify contractor emails
 */

import { fetchWithRetry } from './retryWithBackoff'

const HUNTER_API_KEY = process.env.HUNTER_API_KEY

export interface VerificationResult {
  success: boolean
  email: string | null
  confidence: number  // 0-100
  sources: string[]
  firstName?: string
  lastName?: string
  position?: string
  linkedIn?: string
  twitter?: string
  error?: string
}

export interface DomainSearchResult {
  success: boolean
  emails: {
    email: string
    confidence: number
    firstName: string
    lastName: string
    position: string
    sources: string[]
  }[]
  domain: string
  error?: string
}

export interface EmailVerifierResult {
  success: boolean
  email: string
  status: 'valid' | 'invalid' | 'accept_all' | 'webmail' | 'disposable' | 'unknown'
  score: number  // 0-100
  error?: string
}

/**
 * Find an email address for a contractor using their name and company
 * Uses Hunter.io Email Finder API
 */
export async function findEmail(params: {
  firstName?: string
  lastName?: string
  fullName?: string
  company?: string
  domain?: string
}): Promise<VerificationResult> {
  if (!HUNTER_API_KEY) {
    console.error('[Hunter.io] No API key configured')
    return {
      success: false,
      email: null,
      confidence: 0,
      sources: [],
      error: 'Hunter.io API key not configured'
    }
  }

  // Need either domain/company + name
  const { firstName, lastName, fullName, company, domain } = params

  // Parse full name if first/last not provided
  let fName = firstName
  let lName = lastName
  if (!fName && fullName) {
    const parts = fullName.trim().split(' ')
    fName = parts[0]
    lName = parts.slice(1).join(' ') || undefined
  }

  if (!fName) {
    return {
      success: false,
      email: null,
      confidence: 0,
      sources: [],
      error: 'First name is required'
    }
  }

  // Build query parameters
  const searchParams = new URLSearchParams({
    api_key: HUNTER_API_KEY
  })

  // Use domain if provided, otherwise try to derive from company name
  let searchDomain = domain
  if (!searchDomain && company) {
    // Try common domain patterns
    const cleanCompany = company
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 30)
    searchDomain = `${cleanCompany}.com`
  }

  if (searchDomain) {
    searchParams.append('domain', searchDomain)
  } else if (company) {
    searchParams.append('company', company)
  } else {
    return {
      success: false,
      email: null,
      confidence: 0,
      sources: [],
      error: 'Either domain or company is required'
    }
  }

  searchParams.append('first_name', fName)
  if (lName) {
    searchParams.append('last_name', lName)
  }

  try {
    console.log(`[Hunter.io] Finding email for ${fName} ${lName || ''} at ${searchDomain || company}`)

    const response = await fetchWithRetry(
      `https://api.hunter.io/v2/email-finder?${searchParams.toString()}`,
      { method: 'GET' },
      { maxRetries: 2, initialDelayMs: 1000 }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      // Handle specific Hunter.io errors
      if (response.status === 401) {
        return {
          success: false,
          email: null,
          confidence: 0,
          sources: [],
          error: 'Invalid Hunter.io API key'
        }
      }

      if (response.status === 429) {
        return {
          success: false,
          email: null,
          confidence: 0,
          sources: [],
          error: 'Hunter.io rate limit exceeded'
        }
      }

      return {
        success: false,
        email: null,
        confidence: 0,
        sources: [],
        error: errorData.errors?.[0]?.details || `API error: ${response.status}`
      }
    }

    const result = await response.json()
    const data = result.data

    if (!data || !data.email) {
      return {
        success: false,
        email: null,
        confidence: 0,
        sources: [],
        error: 'No email found'
      }
    }

    console.log(`[Hunter.io] Found email: ${data.email} (confidence: ${data.score})`)

    return {
      success: true,
      email: data.email,
      confidence: data.score || 0,
      sources: data.sources?.map((s: any) => s.domain) || [],
      firstName: data.first_name,
      lastName: data.last_name,
      position: data.position,
      linkedIn: data.linkedin,
      twitter: data.twitter
    }

  } catch (error) {
    console.error('[Hunter.io] Email finder error:', error)
    return {
      success: false,
      email: null,
      confidence: 0,
      sources: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Search for all emails at a domain
 * Uses Hunter.io Domain Search API
 */
export async function searchDomain(domain: string, limit: number = 10): Promise<DomainSearchResult> {
  if (!HUNTER_API_KEY) {
    return {
      success: false,
      emails: [],
      domain,
      error: 'Hunter.io API key not configured'
    }
  }

  try {
    console.log(`[Hunter.io] Searching domain: ${domain}`)

    const searchParams = new URLSearchParams({
      api_key: HUNTER_API_KEY,
      domain,
      limit: limit.toString()
    })

    const response = await fetchWithRetry(
      `https://api.hunter.io/v2/domain-search?${searchParams.toString()}`,
      { method: 'GET' },
      { maxRetries: 2, initialDelayMs: 1000 }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        emails: [],
        domain,
        error: errorData.errors?.[0]?.details || `API error: ${response.status}`
      }
    }

    const result = await response.json()
    const data = result.data

    const emails = (data.emails || []).map((e: any) => ({
      email: e.value,
      confidence: e.confidence || 0,
      firstName: e.first_name || '',
      lastName: e.last_name || '',
      position: e.position || '',
      sources: e.sources?.map((s: any) => s.domain) || []
    }))

    console.log(`[Hunter.io] Found ${emails.length} emails at ${domain}`)

    return {
      success: true,
      emails,
      domain
    }

  } catch (error) {
    console.error('[Hunter.io] Domain search error:', error)
    return {
      success: false,
      emails: [],
      domain,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Verify if an email address is valid and deliverable
 * Uses Hunter.io Email Verifier API
 */
export async function verifyEmail(email: string): Promise<EmailVerifierResult> {
  if (!HUNTER_API_KEY) {
    return {
      success: false,
      email,
      status: 'unknown',
      score: 0,
      error: 'Hunter.io API key not configured'
    }
  }

  try {
    console.log(`[Hunter.io] Verifying email: ${email}`)

    const searchParams = new URLSearchParams({
      api_key: HUNTER_API_KEY,
      email
    })

    const response = await fetchWithRetry(
      `https://api.hunter.io/v2/email-verifier?${searchParams.toString()}`,
      { method: 'GET' },
      { maxRetries: 2, initialDelayMs: 1000 }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        email,
        status: 'unknown',
        score: 0,
        error: errorData.errors?.[0]?.details || `API error: ${response.status}`
      }
    }

    const result = await response.json()
    const data = result.data

    console.log(`[Hunter.io] Verification result: ${data.status} (score: ${data.score})`)

    return {
      success: true,
      email,
      status: data.status || 'unknown',
      score: data.score || 0
    }

  } catch (error) {
    console.error('[Hunter.io] Email verifier error:', error)
    return {
      success: false,
      email,
      status: 'unknown',
      score: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check Hunter.io account status and remaining credits
 */
export async function getAccountInfo(): Promise<{
  success: boolean
  searches?: { used: number; available: number }
  verifications?: { used: number; available: number }
  error?: string
}> {
  if (!HUNTER_API_KEY) {
    return {
      success: false,
      error: 'Hunter.io API key not configured'
    }
  }

  try {
    const response = await fetchWithRetry(
      `https://api.hunter.io/v2/account?api_key=${HUNTER_API_KEY}`,
      { method: 'GET' },
      { maxRetries: 1, initialDelayMs: 500 }
    )

    if (!response.ok) {
      return {
        success: false,
        error: `API error: ${response.status}`
      }
    }

    const result = await response.json()
    const data = result.data

    return {
      success: true,
      searches: {
        used: data.requests?.searches?.used || 0,
        available: data.requests?.searches?.available || 0
      },
      verifications: {
        used: data.requests?.verifications?.used || 0,
        available: data.requests?.verifications?.available || 0
      }
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
