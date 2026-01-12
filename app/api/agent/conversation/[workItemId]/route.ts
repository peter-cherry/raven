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

export async function GET(
  request: Request,
  { params }: { params: { workItemId: string } }
) {
  try {
    const { data, error } = await getSupabase()
      .rpc('get_work_item_full', { item_id: params.workItemId })

    if (error) throw error

    return NextResponse.json({
      work_item: data.work_item,
      messages: data.conversation || [],
      recent_sessions: data.recent_sessions || [],
      recent_activity: data.recent_activity || []
    })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}
