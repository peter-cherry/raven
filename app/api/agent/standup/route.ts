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
    const { date } = await request.json()
    const targetDate = date || new Date().toISOString().split('T')[0]

    const { data, error } = await getSupabase()
      .rpc('generate_daily_standup', { target_date: targetDate })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error generating standup:', error)
    return NextResponse.json(
      { error: 'Failed to generate standup' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const { data, error } = await getSupabase()
      .from('daily_standups')
      .select('*')
      .eq('date', date)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return NextResponse.json(data || null)
  } catch (error) {
    console.error('Error fetching standup:', error)
    return NextResponse.json(
      { error: 'Failed to fetch standup' },
      { status: 500 }
    )
  }
}
