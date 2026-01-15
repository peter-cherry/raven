import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Check if we should use mock mode (no Supabase configured)
function shouldUseMockMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
  return mockMode || !url || !serviceKey;
}

export async function POST(request: Request) {
  try {
    const { address, trade, org_id, exclude_id } = await request.json();

    // Mock mode - return no duplicates for testing without database
    if (shouldUseMockMode()) {
      console.log('[Duplicate Check] Mock mode: returning no duplicates');
      return NextResponse.json({
        hasDuplicates: false,
        duplicates: [],
        mock: true
      });
    }

    // Development mode bypass - use service role key for reliable access
    const isDevelopment = process.env.NODE_ENV === 'development';
    let supabase: any;

    if (isDevelopment) {
      console.log('[Duplicate Check] Dev mode: using service role key');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
      supabase = createClient(url, serviceKey);
    } else {
      const cookieStore = cookies();
      supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    }

    if (!address || !trade) {
      return NextResponse.json(
        { error: 'Address and trade are required' },
        { status: 400 }
      );
    }

    console.log('[Duplicate Check] Checking for:', { address, trade, org_id, exclude_id });

    // Normalize address for comparison - trim and convert to lowercase
    const normalizedAddress = address.toLowerCase().trim();

    // Skip duplicate check if address is too short (likely incomplete)
    if (normalizedAddress.length < 10) {
      console.log('[Duplicate Check] Address too short, skipping check');
      return NextResponse.json({
        hasDuplicates: false,
        duplicates: []
      });
    }

    // Check for duplicate work orders within last 30 days
    // Match on: same org, same trade, EXACT same address (case-insensitive)
    // Use filter to compare normalized addresses (avoids ilike wildcard issues)
    const { data: allJobs, error } = await supabase
      .from('jobs')
      .select('id, job_title, address_text, trade_needed, job_status, created_at, city, state')
      .eq('org_id', org_id)
      .eq('trade_needed', trade)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .neq('job_status', 'archived')
      .order('created_at', { ascending: false })
      .limit(50);

    // Filter for exact address matches (case-insensitive) in application code
    // This avoids PostgreSQL ilike wildcard interpretation issues
    console.log('[Duplicate Check] Total jobs fetched for org/trade:', allJobs?.length || 0);
    console.log('[Duplicate Check] Normalized input address:', normalizedAddress);

    const duplicates = (allJobs || []).filter((job: { id: string; job_title: string; address_text: string | null; trade_needed: string; job_status: string; created_at: string; city: string | null; state: string | null }) => {
      // Exclude the current job if editing
      if (exclude_id && job.id === exclude_id) {
        console.log('[Duplicate Check] Excluding current job:', job.id);
        return false;
      }
      if (!job.address_text) return false;
      const jobAddress = job.address_text.toLowerCase().trim();
      const isMatch = jobAddress === normalizedAddress;
      if (isMatch) {
        console.log('[Duplicate Check] MATCH FOUND:', { jobId: job.id, jobAddress, inputAddress: normalizedAddress });
      }
      return isMatch;
    }).slice(0, 5);

    console.log('[Duplicate Check] Found:', duplicates?.length || 0, 'potential duplicates');

    if (error) {
      console.error('[Duplicate Check] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to check for duplicates' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasDuplicates: duplicates && duplicates.length > 0,
      duplicates: duplicates || []
    });

  } catch (error: any) {
    console.error('[Duplicate Check] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
