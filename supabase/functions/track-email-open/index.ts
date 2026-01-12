import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1x1 transparent GIF pixel
const PIXEL = Uint8Array.from(
  atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')
    .split('')
    .map(c => c.charCodeAt(0))
)

serve(async (req) => {
  try {
    const url = new URL(req.url)

    // Support both old format (?id=outreach/tech) and new format (?outreach=x&tech=y)
    let outreachId: string | null = null
    let techId: string | null = null

    const trackingId = url.searchParams.get('id')
    if (trackingId) {
      // Old format: "outreach_id/tech_id"
      [outreachId, techId] = trackingId.split('/')
    } else {
      // New format: separate params
      outreachId = url.searchParams.get('outreach')
      techId = url.searchParams.get('tech')
    }

    if (outreachId && techId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      console.log(`📧 Email tracking: outreach=${outreachId}, tech=${techId}`)

      // Get recipient to determine dispatch method (BEFORE updating)
      const { data: recipient } = await supabase
        .from('work_order_recipients')
        .select('dispatch_method, email_opened')
        .eq('outreach_id', outreachId)
        .eq('technician_id', techId)
        .single()

      if (recipient && !recipient.email_opened) {
        // Mark email as opened (only once)
        await supabase
          .from('work_order_recipients')
          .update({
            email_opened: true,
            email_opened_at: new Date().toISOString()
          })
          .match({
            outreach_id: outreachId,
            technician_id: techId
          })

        // Determine if warm or cold based on dispatch method
        const isWarm = recipient.dispatch_method === 'sendgrid_warm'

        // Increment appropriate counter using helper function
        if (isWarm) {
          await supabase.rpc('increment_warm_opened', { p_outreach_id: outreachId })
          console.log(`✅ Warm email opened (SendGrid)`)
        } else if (recipient.dispatch_method === 'instantly_cold') {
          await supabase.rpc('increment_cold_opened', { p_outreach_id: outreachId })
          console.log(`✅ Cold email opened (Instantly)`)
        } else {
          // Fallback to generic update for backward compatibility
          await supabase.rpc('update_outreach_stats', { p_outreach_id: outreachId })
          console.log(`✅ Email opened (unknown method: ${recipient.dispatch_method})`)
        }
      } else if (recipient && recipient.email_opened) {
        console.log('Email already marked as opened')
      } else {
        console.error('Recipient not found')
      }
    }

    // Always return 1x1 transparent pixel (even on error, to avoid broken images)
    return new Response(PIXEL, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('❌ Email tracking error:', error)
    // Still return pixel even on error
    return new Response(PIXEL, {
      headers: { 'Content-Type': 'image/gif' }
    })
  }
})
