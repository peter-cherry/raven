/**
 * @deprecated This edge function is DEPRECATED and will be removed in a future release.
 * 
 * The dispatch logic has been moved to the authoritative JobLifecycleService in:
 * - lib/services/job-lifecycle.ts
 * - app/api/jobs/route.ts (POST creates job and dispatches)
 * - app/api/jobs/[id]/dispatch/route.ts (manual dispatch)
 * 
 * This edge function is kept temporarily for backwards compatibility but should NOT
 * be used for new integrations. All dispatch operations should go through the
 * Next.js API routes which provide:
 * - Proper authentication and authorization
 * - Audit logging
 * - Idempotency
 * - Consistent error handling
 * 
 * Migration: Remove calls to this edge function and use POST /api/jobs instead.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Environment variables
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
const SENDGRID_TEMPLATE_ID = Deno.env.get('SENDGRID_TEMPLATE_ID_WORK_ORDER')
const SENDGRID_FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL') || 'jobs@raven-search.com'
const SENDGRID_FROM_NAME = Deno.env.get('SENDGRID_FROM_NAME') || 'Raven Jobs'

const INSTANTLY_API_KEY = Deno.env.get('INSTANTLY_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://ravensearch.ai'

serve(async (req) => {
  try {
    const { job_id } = await req.json()

    if (!job_id) {
      return new Response(JSON.stringify({ error: 'job_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`📋 Dispatching Work Order #${job_id}`)

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`   Trade: ${job.trade_needed}, Location: ${job.address_text}`)

    // Get candidates for this job with signed_up status
    const { data: candidates, error: candidatesError } = await supabase
      .from('job_candidates')
      .select('technician_id, technicians(id, full_name, email, signed_up, business_name)')
      .eq('job_id', job_id)

    if (candidatesError) {
      return new Response(JSON.stringify({ error: candidatesError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const techsWithEmail = (candidates || []).filter(c => c.technicians?.email)

    // Split into warm (signed up) vs cold (never contacted)
    const warmTechs = techsWithEmail.filter(c => c.technicians?.signed_up === true)
    const coldTechs = techsWithEmail.filter(c => c.technicians?.signed_up !== true)

    console.log(`📊 Found: ${warmTechs.length} warm, ${coldTechs.length} cold technicians`)

    // Create outreach record
    const { data: outreach, error: outreachError } = await supabase
      .from('work_order_outreach')
      .insert({
        job_id,
        total_recipients: techsWithEmail.length,
        status: 'in_progress',
        warm_sent: 0,
        cold_sent: 0
      })
      .select()
      .single()

    if (outreachError || !outreach) {
      console.error('Failed to create outreach:', outreachError)
      return new Response(JSON.stringify({ error: 'Failed to create outreach' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    let warmSentCount = 0
    let coldSentCount = 0

    // ==========================================
    // DISPATCH WARM TECHS via SendGrid
    // ==========================================

    if (warmTechs.length > 0 && SENDGRID_API_KEY && SENDGRID_TEMPLATE_ID) {
      console.log(`🔥 Dispatching ${warmTechs.length} warm techs via SendGrid...`)

      for (const candidate of warmTechs) {
        const tech = candidate.technicians

        // Create recipient record
        const { data: recipient } = await supabase
          .from('work_order_recipients')
          .insert({
            outreach_id: outreach.id,
            technician_id: tech.id,
            dispatch_method: 'sendgrid_warm'
          })
          .select()
          .single()

        if (!recipient) continue

        try {
          // Prepare personalization for this tech
          const personalization = {
            to: [{ email: tech.email, name: tech.full_name }],
            dynamic_template_data: {
              tech_name: tech.full_name?.split(' ')[0] || 'there',
              job_type: job.trade_needed || 'Service',
              location: job.address_text || 'See details',
              urgency: job.priority || 'Standard',
              description: job.description || 'See full job details',
              budget: job.budget_max ? `$${job.budget_max}` : 'TBD',
              scheduled: job.scheduled_at ? new Date(job.scheduled_at).toLocaleDateString() : 'ASAP',
              accept_url: `${APP_URL}/jobs/${job_id}/accept?tech=${tech.id}`,
              work_order_id: job_id,
              tech_email: tech.email,
              tracking_pixel: `${supabaseUrl}/functions/v1/track-email-open?outreach=${outreach.id}&tech=${tech.id}`
            }
          }

          // Send via SendGrid
          const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SENDGRID_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: {
                email: SENDGRID_FROM_EMAIL,
                name: SENDGRID_FROM_NAME
              },
              personalizations: [personalization],
              template_id: SENDGRID_TEMPLATE_ID
            })
          })

          if (sendgridResponse.ok) {
            await supabase
              .from('work_order_recipients')
              .update({
                email_sent: true,
                email_sent_at: new Date().toISOString()
              })
              .eq('id', recipient.id)

            warmSentCount++
            console.log(`  ✅ Sent warm email to ${tech.email}`)
          } else {
            const error = await sendgridResponse.text()
            console.error(`  ❌ SendGrid error for ${tech.email}:`, error)
          }
        } catch (error) {
          console.error(`  ❌ Failed to send warm email to ${tech.email}:`, error)
        }
      }

      console.log(`✅ SendGrid sent to ${warmSentCount}/${warmTechs.length} warm techs`)
    } else if (warmTechs.length > 0) {
      console.warn(`⚠️ ${warmTechs.length} warm techs found but SendGrid not configured`)
    }

    // ==========================================
    // DISPATCH COLD TECHS via Instantly
    // ==========================================

    if (coldTechs.length > 0 && INSTANTLY_API_KEY) {
      console.log(`❄️ Dispatching ${coldTechs.length} cold techs via Instantly...`)

      // Map trade to campaign ID
      const campaignMap: Record<string, string> = {
        'HVAC': Deno.env.get('INSTANTLY_CAMPAIGN_ID_HVAC') || '',
        'Plumbing': Deno.env.get('INSTANTLY_CAMPAIGN_ID_PLUMBING') || '',
        'Electrical': Deno.env.get('INSTANTLY_CAMPAIGN_ID_ELECTRICAL') || '',
        'Handyman': Deno.env.get('INSTANTLY_CAMPAIGN_ID_HANDYMAN') || '',
      }

      const campaignId = campaignMap[job.trade_needed] || campaignMap['HVAC']

      if (!campaignId) {
        console.error(`❌ No Instantly campaign ID for trade: ${job.trade_needed}`)
      } else {
        for (const candidate of coldTechs) {
          const tech = candidate.technicians

          // Create recipient record
          const { data: recipient } = await supabase
            .from('work_order_recipients')
            .insert({
              outreach_id: outreach.id,
              technician_id: tech.id,
              dispatch_method: 'instantly_cold'
            })
            .select()
            .single()

          if (!recipient) continue

          try {
            // Send via Instantly.ai
            const response = await fetch('https://api.instantly.ai/api/v1/lead/add', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                api_key: INSTANTLY_API_KEY,
                campaign_id: campaignId,
                email: tech.email,
                first_name: tech.full_name?.split(' ')[0] || 'there',
                last_name: tech.full_name?.split(' ').slice(1).join(' ') || '',
                company_name: tech.business_name || '',
                variables: {
                  job_type: job.trade_needed,
                  location: job.address_text || '',
                  urgency: job.priority || 'Standard',
                  work_order_id: job_id,
                  accept_url: `${APP_URL}/jobs/${job_id}/accept?tech=${tech.id}`,
                  job_title: job.job_title || 'New Job',
                  job_description: job.description || '',
                  job_scheduled: job.scheduled_at ? new Date(job.scheduled_at).toLocaleDateString() : 'TBD',
                  tracking_id: `${outreach.id}/${tech.id}`
                }
              })
            })

            if (response.ok) {
              await supabase
                .from('work_order_recipients')
                .update({
                  email_sent: true,
                  email_sent_at: new Date().toISOString()
                })
                .eq('id', recipient.id)

              coldSentCount++
              console.log(`  ✅ Sent cold email to ${tech.email}`)
            } else {
              const error = await response.text()
              console.error(`  ❌ Instantly error for ${tech.email}:`, error)
            }
          } catch (error) {
            console.error(`  ❌ Failed to send cold email to ${tech.email}:`, error)
          }
        }

        console.log(`✅ Instantly sent to ${coldSentCount}/${coldTechs.length} cold techs`)
      }
    } else if (coldTechs.length > 0) {
      console.warn(`⚠️ ${coldTechs.length} cold techs found but Instantly not configured`)
    }

    // ==========================================
    // UPDATE STATISTICS
    // ==========================================

    // Update outreach stats using the helper function
    await supabase.rpc('update_outreach_stats', { p_outreach_id: outreach.id })

    // Update outreach status
    const totalSent = warmSentCount + coldSentCount
    await supabase
      .from('work_order_outreach')
      .update({
        status: totalSent > 0 ? 'completed' : 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('id', outreach.id)

    // Complete dispatch SLA stage
    try {
      await supabase.rpc('complete_sla_stage', {
        p_job_id: job_id,
        p_current_stage: 'dispatch'
      })
    } catch (err) {
      console.error('Failed to complete SLA stage:', err)
    }

    console.log(`✅ Dispatch complete: ${warmSentCount} warm, ${coldSentCount} cold`)

    return new Response(JSON.stringify({
      success: true,
      outreach_id: outreach.id,
      total_recipients: techsWithEmail.length,
      warm_sent: warmSentCount,
      cold_sent: coldSentCount,
      total_sent: totalSent
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Dispatch error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
