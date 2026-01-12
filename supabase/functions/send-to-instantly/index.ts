import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const instantlyKey = Deno.env.get('INSTANTLY_API_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { campaign_id, target_ids } = await req.json()

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('outreach_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      throw new Error(`Campaign not found: ${campaignError?.message}`)
    }

    if (!campaign.instantly_campaign_id) {
      throw new Error('Campaign has no Instantly campaign ID')
    }

    // Get targets
    const { data: targets, error: targetsError } = await supabase
      .from('outreach_targets')
      .select('*')
      .in('id', target_ids)
      .eq('enrichment_status', 'completed')

    if (targetsError || !targets || targets.length === 0) {
      throw new Error(`No enriched targets found: ${targetsError?.message}`)
    }

    let emailsSent = 0
    let emailsFailed = 0

    // Send each target to Instantly
    for (const target of targets) {
      try {
        const response = await fetch('https://api.instantly.ai/api/v1/lead/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: instantlyKey,
            campaign_id: campaign.instantly_campaign_id,
            email: target.email,
            first_name: target.full_name?.split(' ')[0] || '',
            last_name: target.full_name?.split(' ')[1] || '',
            company_name: target.company || '',
            phone: target.phone || '',
            variables: {
              trade: target.trade || '',
              state: target.state || ''
            }
          })
        })

        if (response.ok) {
          // Create campaign recipient record
          await supabase
            .from('campaign_recipients')
            .insert({
              campaign_id,
              target_id: target.id,
              email_sent: true,
              email_sent_at: new Date().toISOString()
            })

          emailsSent++
        } else {
          console.error(`Failed to send email to ${target.email}:`, await response.text())
          emailsFailed++
        }
      } catch (error) {
        console.error(`Error sending email to ${target.email}:`, error)
        emailsFailed++
      }
    }

    // Update campaign stats
    await supabase
      .from('outreach_campaigns')
      .update({
        emails_sent: campaign.emails_sent + emailsSent
      })
      .eq('id', campaign_id)

    return new Response(JSON.stringify({
      success: true,
      campaign_id,
      emails_sent: emailsSent,
      emails_failed: emailsFailed,
      total_processed: targets.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Send to Instantly error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
