import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// Lazy initialization to avoid build-time errors when env vars aren't set
let _supabase: any = null

const getSupabase = (): any => {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Supabase credentials not configured')
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(request: Request) {
  try {
    const { work_item_id, message } = await request.json()

    // 1. Get full context - Use direct query instead of RPC to avoid JSON parsing issues
    const { data: workItem, error: workItemError } = await getSupabase()
      .from('work_items')
      .select('*')
      .eq('id', work_item_id)
      .single()

    if (workItemError || !workItem) {
      console.error('Error fetching work item:', workItemError)
      throw new Error('Work item not found')
    }

    // Get recent sessions
    const { data: recentSessions } = await getSupabase()
      .from('work_sessions')
      .select('*')
      .eq('work_item_id', work_item_id)
      .order('started_at', { ascending: false })
      .limit(5)

    // Get conversation history
    const { data: threads } = await getSupabase()
      .from('conversation_threads')
      .select('id')
      .eq('work_item_id', work_item_id)
      .eq('active', true)
      .limit(1)

    let conversationHistory: any[] = []
    if (threads && threads.length > 0) {
      const { data: messages } = await getSupabase()
        .from('conversation_messages')
        .select('*')
        .eq('thread_id', threads[0].id)
        .order('created_at', { ascending: true })
        .limit(50)

      conversationHistory = messages || []
    }

    // 2. Build comprehensive system prompt
    const systemPrompt = `You are Raven Agent, a persistent autonomous development assistant for Raven Search.

**MISSION:**
Work on assigned tasks until ALL completion criteria are met. Never mark work as done until verified and tested.

**CURRENT WORK ITEM:**
Title: ${workItem.title}
Description: ${workItem.description}
Type: ${workItem.type}
Priority: ${workItem.priority}
Status: ${workItem.status}
Progress: ${workItem.progress_percentage}%

**COMPLETION CRITERIA (ALL must be checked off):**
${JSON.stringify(workItem.completion_criteria, null, 2)}

**IMPLEMENTATION PLAN:**
${JSON.stringify(workItem.implementation_plan, null, 2)}

**CONTEXT & DECISIONS:**
${JSON.stringify(workItem.context, null, 2)}

**RECENT WORK SESSIONS:**
${JSON.stringify(recentSessions?.slice(0, 3) || [], null, 2)}

**YOUR CAPABILITIES:**
- Read/write files via MCP filesystem access
- Query/modify Supabase database
- Run migrations and tests
- Create GitHub issues and PRs
- Query Sentry for errors
- Execute bash commands

**CRITICAL RULES:**
1. Be SPECIFIC and ACTIONABLE - no vague suggestions
2. UPDATE completion criteria as you progress (I can help you mark them complete)
3. If BLOCKED, clearly state what you need and mark status as blocked
4. VALIDATE your work before marking criteria complete
5. Keep conversation focused on THIS work item
6. Think step-by-step before implementing
7. Consider edge cases and error handling
8. Write tests alongside code

**RESPONSE FORMAT:**
When you complete a criterion, explicitly state:
"CRITERION_COMPLETE: [criterion text]"

When you're blocked, state:
"BLOCKED: [reason]"

When you need me to do something:
"ACTION_REQUIRED: [what you need]"

Previous conversation context provided below. Maintain continuity.`

    // 3. Build messages array - filter out system messages
    const messages = [
      ...conversationHistory.slice(-30)
        .filter((msg: any) => msg.role !== 'system') // Filter out system messages
        .map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
      {
        role: 'user',
        content: message
      }
    ]

    // 4. Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: systemPrompt,
      messages
    })

    // Extract text from response (handle TextBlock vs ThinkingBlock)
    const firstBlock = response.content[0]
    const assistantMessage = firstBlock.type === 'text' ? firstBlock.text : ''

    // 5. Parse for special commands
    let criteriaUpdated = false
    let statusChanged = false

    if (assistantMessage.includes('CRITERION_COMPLETE:')) {
      // Extract criterion and mark it complete
      const criterionMatch = assistantMessage.match(/CRITERION_COMPLETE: (.+?)(?:\n|$)/)
      if (criterionMatch) {
        const criterionText = criterionMatch[1].trim()

        // Update completion criteria
        const updatedCriteria = workItem.completion_criteria.map((c: any) => {
          if (c.criterion.toLowerCase().includes(criterionText.toLowerCase())) {
            return { ...c, completed: true, completed_at: new Date().toISOString() }
          }
          return c
        })

        await getSupabase()
          .from('work_items')
          .update({ completion_criteria: updatedCriteria })
          .eq('id', work_item_id)

        criteriaUpdated = true
      }
    }

    if (assistantMessage.includes('BLOCKED:')) {
      const blockedMatch = assistantMessage.match(/BLOCKED: (.+?)(?:\n|$)/)
      if (blockedMatch) {
        await getSupabase()
          .from('work_items')
          .update({
            status: 'blocked',
            blocked_reason: blockedMatch[1].trim(),
            blocked_at: new Date().toISOString()
          })
          .eq('id', work_item_id)

        statusChanged = true
      }
    }

    // 6. Get or create conversation thread
    let { data: thread } = await getSupabase()
      .from('conversation_threads')
      .select('id')
      .eq('work_item_id', work_item_id)
      .eq('active', true)
      .single()

    if (!thread) {
      const { data: newThread, error: threadError } = await getSupabase()
        .from('conversation_threads')
        .insert({
          work_item_id,
          title: workItem.title
        })
        .select('id')
        .single()

      if (threadError || !newThread) {
        throw new Error('Failed to create conversation thread')
      }

      thread = newThread
    }

    // 7. Save messages
    await getSupabase()
      .from('conversation_messages')
      .insert([
        {
          thread_id: thread.id,
          role: 'user',
          content: message
        },
        {
          thread_id: thread.id,
          role: 'assistant',
          content: assistantMessage,
          tokens_used: response.usage.output_tokens
        }
      ])

    return NextResponse.json({
      content: assistantMessage,
      criteria_updated: criteriaUpdated,
      status_changed: statusChanged
    })

  } catch (error) {
    console.error('Error in agent chat:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
