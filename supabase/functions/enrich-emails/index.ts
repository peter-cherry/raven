import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Email Enrichment Edge Function
 *
 * Uses Hunter.io to:
 * 1. DISCOVER emails from website domains (Domain Search API)
 * 2. VERIFY discovered emails (Email Verifier API)
 *
 * Called for each target in the email_enrichment_queue
 */

interface HunterEmail {
  value: string
  type: string
  confidence: number
  first_name: string
  last_name: string
  position: string
  department: string
}

interface HunterDomainSearchResponse {
  data: {
    domain: string
    disposable: boolean
    webmail: boolean
    pattern: string
    emails: HunterEmail[]
  }
  meta: {
    results: number
  }
}

interface HunterVerifyResponse {
  data: {
    status: 'valid' | 'invalid' | 'accept_all' | 'webmail' | 'disposable' | 'unknown'
    score: number
    email: string
    regexp: boolean
    gibberish: boolean
    disposable: boolean
    webmail: boolean
    mx_records: boolean
    smtp_server: boolean
    smtp_check: boolean
    accept_all: boolean
    block: boolean
  }
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const hunterApiKey = Deno.env.get('HUNTER_API_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { target_id } = await req.json()

    if (!target_id) {
      throw new Error('target_id is required')
    }

    console.log(`[enrich-emails] Starting enrichment for target: ${target_id}`)

    // Get target from database
    const { data: target, error: targetError } = await supabase
      .from('outreach_targets')
      .select('*')
      .eq('id', target_id)
      .single()

    if (targetError || !target) {
      throw new Error(`Target not found: ${targetError?.message}`)
    }

    // Get enrichment queue entry (contains domain)
    const { data: queueEntry } = await supabase
      .from('email_enrichment_queue')
      .select('domain')
      .eq('target_id', target_id)
      .single()

    const domain = queueEntry?.domain || extractDomain(target.website)

    if (!domain) {
      console.log(`[enrich-emails] No domain found for target ${target_id}, skipping`)

      // Mark as completed with no email found
      await supabase
        .from('outreach_targets')
        .update({
          email_found: false,
          email_verified: false,
          status: 'pending'
        })
        .eq('id', target_id)

      await supabase
        .from('email_enrichment_queue')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('target_id', target_id)

      return new Response(JSON.stringify({
        success: true,
        target_id,
        message: 'No domain available for email discovery'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update queue status to processing
    await supabase
      .from('email_enrichment_queue')
      .update({ status: 'processing', last_attempt_at: new Date().toISOString() })
      .eq('target_id', target_id)

    let discoveredEmail: HunterEmail | null = null
    let isVerified = false
    let allEmails: HunterEmail[] = []

    // If we have Hunter.io API key, use it for email discovery
    if (hunterApiKey) {
      try {
        // Step 1: Domain Search - Discover emails from website domain
        console.log(`[enrich-emails] Searching domain: ${domain}`)

        const searchResponse = await fetch(
          `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${hunterApiKey}`
        )

        if (searchResponse.ok) {
          const searchData: HunterDomainSearchResponse = await searchResponse.json()
          allEmails = searchData.data?.emails || []

          if (allEmails.length > 0) {
            // Sort by confidence and get the best match
            const sortedEmails = allEmails.sort((a, b) => b.confidence - a.confidence)
            discoveredEmail = sortedEmails[0]

            console.log(`[enrich-emails] Found ${allEmails.length} emails, best: ${discoveredEmail.value} (confidence: ${discoveredEmail.confidence})`)

            // Step 2: Verify the discovered email
            const verifyResponse = await fetch(
              `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(discoveredEmail.value)}&api_key=${hunterApiKey}`
            )

            if (verifyResponse.ok) {
              const verifyData: HunterVerifyResponse = await verifyResponse.json()
              isVerified = verifyData.data?.status === 'valid' || verifyData.data?.status === 'accept_all'

              console.log(`[enrich-emails] Verification result for ${discoveredEmail.value}: ${verifyData.data?.status} (score: ${verifyData.data?.score})`)
            }
          } else {
            console.log(`[enrich-emails] No emails found for domain: ${domain}`)
          }

          // Store all discovered emails for future reference (using already-parsed data)
          await supabase
            .from('email_enrichment_queue')
            .update({
              emails_found: allEmails
            })
            .eq('target_id', target_id)
        } else {
          const errorText = await searchResponse.text()
          console.error(`[enrich-emails] Hunter domain search failed: ${searchResponse.status} - ${errorText}`)
        }
      } catch (error) {
        console.error('[enrich-emails] Hunter.io API error:', error)
      }
    } else {
      console.warn('[enrich-emails] No HUNTER_API_KEY configured, using mock data')

      // Mock email discovery for testing
      discoveredEmail = {
        value: `contact@${domain}`,
        type: 'generic',
        confidence: 50,
        first_name: target.business_name?.split(' ')[0] || 'Contact',
        last_name: '',
        position: 'General',
        department: ''
      }
      isVerified = false
    }

    // Update target with discovered email
    const updateData: Record<string, any> = {
      email_found: !!discoveredEmail,
      email_verified: isVerified,
      status: discoveredEmail ? 'enriched' : 'pending'
    }

    if (discoveredEmail) {
      updateData.email = discoveredEmail.value
      updateData.contact_name = `${discoveredEmail.first_name || ''} ${discoveredEmail.last_name || ''}`.trim() || null
      updateData.email_source = 'hunter_domain_search'
    }

    await supabase
      .from('outreach_targets')
      .update(updateData)
      .eq('id', target_id)

    // Update enrichment queue
    await supabase
      .from('email_enrichment_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('target_id', target_id)

    console.log(`[enrich-emails] Completed enrichment for target ${target_id}: email_found=${!!discoveredEmail}, verified=${isVerified}`)

    // AUTO-DISPATCH: If email is verified (either newly verified OR already verified in database)
    // Use discovered email if available, otherwise fall back to target's existing email
    const emailToDispatch = discoveredEmail?.value || target.email
    const shouldDispatch = (isVerified || target.email_verified) && emailToDispatch

    console.log(`[enrich-emails] Dispatch check: isVerified=${isVerified}, target.email_verified=${target.email_verified}, emailToDispatch=${emailToDispatch}, shouldDispatch=${shouldDispatch}`)

    if (shouldDispatch) {
      console.log(`[enrich-emails] Auto-dispatching verified email to Instantly: ${emailToDispatch}`)

      // Build contact info from discovered email or target
      const firstName = discoveredEmail?.first_name || target.contact_name?.split(' ')[0] || ''
      const lastName = discoveredEmail?.last_name || target.contact_name?.split(' ').slice(1).join(' ') || ''
      const fullName = `${firstName} ${lastName}`.trim() || null

      // 1. Copy to cold_leads table
      const { error: coldLeadError } = await supabase
        .from('cold_leads')
        .upsert({
          email: emailToDispatch,
          full_name: fullName,
          company_name: target.business_name,
          phone: target.phone,
          website: target.website,
          city: target.city,
          state: target.state,
          trade_type: target.trade_type,
          email_verified: true,
          supersearch_query: 'google_maps_scrape',
          created_at: new Date().toISOString()
        }, { onConflict: 'email' })

      if (coldLeadError) {
        console.error(`[enrich-emails] Failed to copy to cold_leads:`, coldLeadError)
      } else {
        console.log(`[enrich-emails] Copied to cold_leads: ${emailToDispatch}`)
      }

      // 2. Get campaign ID based on trade type (case-insensitive lookup)
      const tradeType = target.trade_type?.toUpperCase() || ''
      const tradeCampaigns: Record<string, string> = {
        'HVAC': Deno.env.get('INSTANTLY_CAMPAIGN_ID_HVAC') || '',
        'PLUMBING': Deno.env.get('INSTANTLY_CAMPAIGN_ID_PLUMBING') || '',
        'ELECTRICAL': Deno.env.get('INSTANTLY_CAMPAIGN_ID_ELECTRICAL') || '',
        'HANDYMAN': Deno.env.get('INSTANTLY_CAMPAIGN_ID_HANDYMAN') || '',
      }

      const campaignId = tradeCampaigns[tradeType] || Deno.env.get('INSTANTLY_CAMPAIGN_ID_COLD') || ''
      const instantlyApiKey = Deno.env.get('INSTANTLY_API_KEY')

      console.log(`[enrich-emails] Trade type: "${target.trade_type}" -> "${tradeType}", Campaign ID: ${campaignId ? campaignId.substring(0, 8) + '...' : 'NONE'}, API Key present: ${!!instantlyApiKey}`)

      if (campaignId && instantlyApiKey) {
        // 3. Push to Instantly (V2 API with Bearer auth)
        try {
          const instantlyPayload = {
            campaign: campaignId,
            email: emailToDispatch,
            first_name: firstName,
            last_name: lastName,
            company_name: target.business_name || '',
            phone: target.phone || '',
            website: target.website || '',
            skip_if_in_campaign: true,
            custom_variables: {
              trade: target.trade_type || '',
              city: target.city || '',
              state: target.state || ''
            }
          }

          console.log(`[enrich-emails] Instantly V2 payload:`, JSON.stringify(instantlyPayload))

          const instantlyResponse = await fetch('https://api.instantly.ai/api/v2/leads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${instantlyApiKey}`
            },
            body: JSON.stringify(instantlyPayload)
          })

          const responseText = await instantlyResponse.text()
          console.log(`[enrich-emails] Instantly response: ${instantlyResponse.status} - ${responseText}`)

          if (instantlyResponse.ok) {
            console.log(`[enrich-emails] SUCCESS: Pushed to Instantly campaign ${campaignId}: ${emailToDispatch}`)

            // Update cold_leads with dispatch info
            await supabase
              .from('cold_leads')
              .update({
                first_dispatched_at: new Date().toISOString(),
                last_dispatched_at: new Date().toISOString(),
                dispatch_count: 1
              })
              .eq('email', emailToDispatch)
          } else {
            console.error(`[enrich-emails] Instantly API error: ${instantlyResponse.status} - ${responseText}`)
          }
        } catch (instantlyError) {
          console.error(`[enrich-emails] Failed to push to Instantly:`, instantlyError)
        }
      } else {
        console.warn(`[enrich-emails] No campaign ID for trade "${target.trade_type}" (normalized: "${tradeType}") or missing INSTANTLY_API_KEY`)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      target_id,
      email_found: !!discoveredEmail,
      email: discoveredEmail?.value || null,
      email_verified: isVerified
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('[enrich-emails] Error:', error)

    // Try to update failure status
    try {
      const body = await req.clone().json()
      if (body.target_id) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Increment attempts in queue
        const { data: currentQueue } = await supabase
          .from('email_enrichment_queue')
          .select('attempts')
          .eq('target_id', body.target_id)
          .single()

        await supabase
          .from('email_enrichment_queue')
          .update({
            status: 'failed',
            attempts: (currentQueue?.attempts || 0) + 1,
            last_attempt_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('target_id', body.target_id)
      }
    } catch (updateError) {
      console.error('[enrich-emails] Failed to update failure status:', updateError)
    }

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

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
