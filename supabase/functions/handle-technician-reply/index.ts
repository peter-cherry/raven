import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { outreach_id, technician_id, reply_content } = await req.json()

    // Update recipient record
    await supabase
      .from('work_order_recipients')
      .update({
        replied: true,
        replied_at: new Date().toISOString(),
        reply_content
      })
      .match({
        outreach_id,
        technician_id
      })

    // Update outreach stats
    await supabase.rpc('update_outreach_stats', { p_outreach_id: outreach_id })

    // Get or create AI conversation
    const { data: existingConvo } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('technician_id', technician_id)
      .eq('outreach_id', outreach_id)
      .single()

    if (existingConvo) {
      // Append message to existing conversation
      const messages = existingConvo.messages || []
      messages.push({
        id: crypto.randomUUID(),
        sender: 'technician',
        content: reply_content,
        created_at: new Date().toISOString(),
        qualified: null
      })

      await supabase
        .from('ai_conversations')
        .update({ messages })
        .eq('id', existingConvo.id)
    } else {
      // Create new conversation
      await supabase
        .from('ai_conversations')
        .insert({
          technician_id,
          outreach_id,
          job_id: (await supabase
            .from('work_order_outreach')
            .select('job_id')
            .eq('id', outreach_id)
            .single()).data?.job_id,
          messages: [{
            id: crypto.randomUUID(),
            sender: 'technician',
            content: reply_content,
            created_at: new Date().toISOString(),
            qualified: null
          }],
          status: 'active'
        })
    }

    // Trigger AI qualification bot
    await fetch(`${supabaseUrl}/functions/v1/ai-qualification-bot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outreach_id,
        technician_id,
        reply_content
      })
    })

    return new Response(JSON.stringify({
      success: true,
      message: 'Reply processed and AI bot triggered'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Handle reply error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
