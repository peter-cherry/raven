import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Development mode bypass - use service role key
    const isDevelopment = process.env.NODE_ENV === 'development';
    let supabase: any;

    if (isDevelopment) {
      console.log('[Job List API] Dev mode: using service role key');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
      supabase = createClient(url, serviceKey);
    } else {
      const cookieStore = cookies();
      supabase = createRouteHandlerClient({ cookies: () => cookieStore });

      // Get authenticated user (only in production)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Get total count
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    // Get paginated jobs
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[Job List API] Database error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      jobs: jobs || [],
      totalCount: count || 0,
      page,
      perPage
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Job List API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
