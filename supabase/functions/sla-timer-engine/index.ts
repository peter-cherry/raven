import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all active (incomplete, non-breached) timers
    const { data: timers, error: timersError } = await supabase
      .from('sla_timers')
      .select('*')
      .is('completed_at', null)
      .eq('breached', false)

    if (timersError) {
      console.error('Error fetching timers:', timersError)
      return new Response(JSON.stringify({ error: timersError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const now = new Date()
    const alerts = []
    const breaches = []

    for (const timer of timers || []) {
      const startedAt = new Date(timer.started_at)
      const elapsedMinutes = (now.getTime() - startedAt.getTime()) / 60000
      const remainingMinutes = timer.target_minutes - elapsedMinutes

      // Check for breach (elapsed time >= target)
      if (elapsedMinutes >= timer.target_minutes) {
        // Mark as breached
        await supabase
          .from('sla_timers')
          .update({
            breached: true,
            breach_time: now.toISOString()
          })
          .eq('id', timer.id)

        // Update job
        await supabase
          .from('jobs')
          .update({ sla_breached: true })
          .eq('id', timer.job_id)

        // Create breach alert
        await supabase
          .from('sla_alerts')
          .insert({
            job_id: timer.job_id,
            timer_id: timer.id,
            alert_type: 'breach',
            stage: timer.stage,
            message: `SLA breached for ${timer.stage} stage. Exceeded ${timer.target_minutes} minute target.`
          })

        breaches.push({
          job_id: timer.job_id,
          stage: timer.stage,
          elapsed_minutes: Math.round(elapsedMinutes)
        })

        continue
      }

      // Check for warning (< 25% time remaining)
      const warningThreshold = timer.target_minutes * 0.25
      if (remainingMinutes > 0 && remainingMinutes <= warningThreshold) {
        // Check if we already sent a warning for this timer
        const { data: existingWarning } = await supabase
          .from('sla_alerts')
          .select('id')
          .eq('timer_id', timer.id)
          .eq('alert_type', 'warning')
          .single()

        if (!existingWarning) {
          // Create warning alert
          await supabase
            .from('sla_alerts')
            .insert({
              job_id: timer.job_id,
              timer_id: timer.id,
              alert_type: 'warning',
              stage: timer.stage,
              message: `SLA warning for ${timer.stage} stage. Only ${Math.round(remainingMinutes)} minutes remaining.`
            })

          alerts.push({
            job_id: timer.job_id,
            stage: timer.stage,
            remaining_minutes: Math.round(remainingMinutes)
          })
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      checked: timers?.length || 0,
      alerts: alerts.length,
      breaches: breaches.length,
      details: { alerts, breaches }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('SLA timer engine error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
