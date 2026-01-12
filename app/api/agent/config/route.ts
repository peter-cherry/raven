import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// GET /api/agent/config - Get current system prompt
export async function GET(request: Request) {
  try {
    const { data, error } = await getSupabase()
      .from('agent_config')
      .select('*')
      .eq('config_key', 'system_prompt')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching system prompt:', error)
      return NextResponse.json(
        { error: 'Failed to fetch system prompt' },
        { status: 500 }
      )
    }

    // If no config exists, return default
    if (!data) {
      return NextResponse.json({
        prompt_template: 'You are Raven Agent, a persistent autonomous development assistant for Raven Search.',
        version: 0,
        is_default: true
      })
    }

    return NextResponse.json({
      id: data.id,
      prompt_template: data.prompt_template,
      version: data.version,
      updated_by: data.updated_by,
      updated_at: data.updated_at,
      is_default: false
    })

  } catch (error) {
    console.error('Error in GET /api/agent/config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/agent/config - Update system prompt
export async function PUT(request: Request) {
  try {
    const { prompt_template, updated_by = 'user', change_reason } = await request.json()

    if (!prompt_template || typeof prompt_template !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt_template' },
        { status: 400 }
      )
    }

    // Validate that required variables are present
    const requiredVariables = [
      '${workItem.title}',
      '${workItem.description}',
      '${workItem.status}'
    ]

    const missingVariables = requiredVariables.filter(
      v => !prompt_template.includes(v)
    )

    if (missingVariables.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required template variables',
          missing: missingVariables,
          hint: 'The system prompt must include: ${workItem.title}, ${workItem.description}, ${workItem.status}'
        },
        { status: 400 }
      )
    }

    // Use the stored procedure to update with versioning
    const { data, error } = await getSupabase().rpc('update_system_prompt', {
      new_prompt: prompt_template,
      updated_by_user: updated_by,
      reason: change_reason || null
    })

    if (error) {
      console.error('Error updating system prompt:', error)
      return NextResponse.json(
        { error: 'Failed to update system prompt' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ...data,
      message: 'System prompt updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/agent/config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/agent/config/history - Get prompt version history
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const { data, error } = await getSupabase().rpc('get_prompt_history', {
      limit_count: limit
    })

    if (error) {
      console.error('Error fetching prompt history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch prompt history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      history: data || []
    })

  } catch (error) {
    console.error('Error in DELETE /api/agent/config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
