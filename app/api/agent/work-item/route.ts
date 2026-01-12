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

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.title || !data.description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    // Create work item
    const { data: workItem, error } = await getSupabase()
      .from('work_items')
      .insert({
        title: data.title,
        description: data.description,
        type: data.type || 'feature',
        priority: data.priority || 'medium',
        completion_criteria: data.completion_criteria || [],
        implementation_plan: data.implementation_plan || {},
        context: data.context || {},
        tags: data.tags || [],
        estimated_effort_hours: data.estimated_effort_hours
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ work_item: workItem })
  } catch (error) {
    console.error('Error creating work item:', error)
    return NextResponse.json(
      { error: 'Failed to create work item' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...updates } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Work item ID is required' },
        { status: 400 }
      )
    }

    const { data: workItem, error } = await getSupabase()
      .from('work_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ work_item: workItem })
  } catch (error) {
    console.error('Error updating work item:', error)
    return NextResponse.json(
      { error: 'Failed to update work item' },
      { status: 500 }
    )
  }
}
