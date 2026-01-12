import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { job_id } = await request.json();
    if (!job_id) {
      return NextResponse.json({ success: false, error: 'job_id is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch job details needed for matching
    const { data: job, error } = await supabase
      .from('jobs')
      .select('id, lat, lng, state, trade_needed')
      .eq('id', job_id)
      .single();

    if (error || !job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Ensure coords exist
    const lat = typeof job.lat === 'number' ? job.lat : Number(job.lat);
    const lng = typeof job.lng === 'number' ? job.lng : Number(job.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ success: false, error: 'Job location missing' }, { status: 400 });
    }

    // Re-run matching with 4km radius
    await supabase.rpc('find_matching_technicians', {
      p_job_id: job.id,
      p_lat: lat,
      p_lng: lng,
      p_trade: job.trade_needed,
      p_state: job.state,
      p_max_distance_m: 10000,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'Failed to re-run matching' }, { status: 500 });
  }
}
