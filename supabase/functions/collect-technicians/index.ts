import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { source, trade, state, query } = await req.json()

    // Create scraping activity record
    const { data: activity, error: activityError } = await supabase
      .from('scraping_activity')
      .insert({
        source,
        trade,
        state,
        query,
        status: 'running'
      })
      .select()
      .single()

    if (activityError) {
      throw new Error(`Failed to create activity: ${activityError.message}`)
    }

    // Mock scraping results (in production, this would call Google Places API, Yelp API, etc.)
    // For now, we'll just return mock data to demonstrate the flow
    const mockResults = [
      {
        email: `tech1@${trade.toLowerCase()}.com`,
        full_name: `John ${trade}`,
        company: `${trade} Solutions LLC`,
        phone: '555-0001',
        state,
        trade
      },
      {
        email: `tech2@${trade.toLowerCase()}.com`,
        full_name: `Jane ${trade}`,
        company: `${trade} Experts Inc`,
        phone: '555-0002',
        state,
        trade
      },
      {
        email: `tech3@${trade.toLowerCase()}.com`,
        full_name: `Bob ${trade}`,
        company: `${trade} Pro Services`,
        phone: '555-0003',
        state,
        trade
      }
    ]

    let newTargets = 0
    let duplicateTargets = 0

    // Insert targets
    for (const result of mockResults) {
      const { error } = await supabase
        .from('outreach_targets')
        .insert({
          email: result.email,
          full_name: result.full_name,
          company: result.company,
          phone: result.phone,
          state: result.state,
          trade: result.trade,
          source: source,
          enrichment_status: 'pending'
        })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          duplicateTargets++
        } else {
          console.error('Error inserting target:', error)
        }
      } else {
        newTargets++
      }
    }

    // Update activity record
    await supabase
      .from('scraping_activity')
      .update({
        status: 'completed',
        results_found: mockResults.length,
        new_targets: newTargets,
        duplicate_targets: duplicateTargets,
        completed_at: new Date().toISOString()
      })
      .eq('id', activity.id)

    return new Response(JSON.stringify({
      success: true,
      activity_id: activity.id,
      results_found: mockResults.length,
      new_targets: newTargets,
      duplicate_targets: duplicateTargets
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Collect technicians error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
