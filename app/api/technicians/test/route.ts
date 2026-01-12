import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors when env vars aren't set
let _supabase: any = null

const getSupabase = (): any => {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      throw new Error('Supabase credentials not configured')
    }
    _supabase = createClient(url, anonKey)
  }
  return _supabase
}

export async function GET() {
  const { data, error } = await getSupabase()
    .from('technicians')
    .select('*')
    .order('average_rating', { ascending: false });

  if (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      count: 0
    });
  }

  return NextResponse.json({
    success: true,
    count: data?.length || 0,
    technicians: data?.slice(0, 5).map((t: any) => ({
      id: t.id,
      full_name: t.full_name,
      trade_needed: t.trade_needed,
      city: t.city,
      state: t.state
    }))
  });
}
