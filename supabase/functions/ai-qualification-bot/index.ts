import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { outreach_id, technician_id, reply_content } = await req.json()

    // Get job details
    const { data: outreach } = await supabase
      .from('work_order_outreach')
      .select('job_id')
      .eq('id', outreach_id)
      .single()

    if (!outreach) {
      throw new Error('Outreach not found')
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', outreach.job_id)
      .single()

    if (!job) {
      throw new Error('Job not found')
    }

    // Get conversation history
    const { data: conversation } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('technician_id', technician_id)
      .eq('outreach_id', outreach_id)
      .single()

    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // Build conversation context for AI
    const conversationHistory = conversation.messages.map((msg: any) => ({
      role: msg.sender === 'technician' ? 'user' : 'assistant',
      content: msg.content
    }))

    // Call OpenAI to qualify technician
    const qualificationPrompt = `You are an AI assistant helping qualify technicians for service jobs.

Job Details:
- Trade: ${job.trade_needed}
- Urgency: ${job.urgency}
- Address: ${job.address}
- Description: ${job.description}

The technician has replied. Analyze their response and determine:
1. Are they interested and available?
2. Do they have the required skills/licenses?
3. Are they willing to accept the job terms?

Respond with ONLY a JSON object in this format:
{
  "qualified": true or false,
  "reason": "Brief explanation",
  "follow_up": "Next question to ask, or null if qualified/disqualified"
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: qualificationPrompt },
          ...conversationHistory
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`)
    }

    const aiResponse = await response.json()
    const aiMessage = aiResponse.choices[0].message.content

    // Parse AI response
    let qualification
    try {
      qualification = JSON.parse(aiMessage)
    } catch {
      // Fallback if AI doesn't return valid JSON
      qualification = {
        qualified: null,
        reason: 'Unable to parse AI response',
        follow_up: 'Thank you for your reply. Someone from our team will review your response and get back to you shortly.'
      }
    }

    // Update conversation with AI response
    const messages = conversation.messages || []

    // Mark technician's last message with qualification status
    if (messages.length > 0) {
      messages[messages.length - 1].qualified = qualification.qualified
    }

    // Add AI follow-up message if exists
    if (qualification.follow_up) {
      messages.push({
        id: crypto.randomUUID(),
        sender: 'system',
        content: qualification.follow_up,
        created_at: new Date().toISOString(),
        qualified: null
      })
    }

    await supabase
      .from('ai_conversations')
      .update({
        messages,
        status: qualification.qualified === true ? 'qualified' :
                qualification.qualified === false ? 'disqualified' : 'active',
        qualification_reason: qualification.reason
      })
      .eq('id', conversation.id)

    // If qualified, update recipient status
    if (qualification.qualified === true) {
      await supabase
        .from('work_order_recipients')
        .update({
          qualified: true,
          qualified_at: new Date().toISOString()
        })
        .match({
          outreach_id,
          technician_id
        })

      // Update outreach stats
      await supabase.rpc('update_outreach_stats', { p_outreach_id: outreach_id })
    }

    return new Response(JSON.stringify({
      success: true,
      qualification
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('AI qualification error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
