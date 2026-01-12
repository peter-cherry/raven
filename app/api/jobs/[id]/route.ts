import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Development mode bypass - use service role key
    const isDevelopment = process.env.NODE_ENV === 'development';
    let supabase: any;

    if (isDevelopment) {
      console.log('[API /jobs/[id]] Dev mode: using service role key');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
      supabase = createClient(url, serviceKey);
    } else {
      // Create authenticated Supabase client for API routes
      supabase = createRouteHandlerClient({ cookies });
    }

    // Query the jobs table for all data including full work order text
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[API /jobs/[id]] Supabase error:', error);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API /jobs/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    console.log('[API /jobs/[id] DELETE] Attempting to delete job:', id);

    // Create authenticated client to verify user is logged in
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[API /jobs/[id] DELETE] Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[API /jobs/[id] DELETE] User authenticated:', user.id);

    // Verify user has access to this job through org membership
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('org_id')
      .eq('id', id)
      .single();

    if (jobError || !job) {
      console.error('[API /jobs/[id] DELETE] Job not found:', jobError);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if user is member of the job's organization
    const { data: membership, error: memberError } = await supabase
      .from('org_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', job.org_id)
      .single();

    if (memberError || !membership) {
      console.error('[API /jobs/[id] DELETE] User not member of org:', memberError);
      return NextResponse.json(
        { error: 'Forbidden - not a member of this organization' },
        { status: 403 }
      );
    }

    console.log('[API /jobs/[id] DELETE] User is org member with role:', membership.role);

    // Use service role client to bypass RLS for deletion
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
      console.error('[API /jobs/[id] DELETE] SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete the job using service role client (bypasses RLS)
    const { error: deleteError } = await serviceClient
      .from('jobs')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[API /jobs/[id] DELETE] Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete job: ' + deleteError.message },
        { status: 500 }
      );
    }

    console.log('[API /jobs/[id] DELETE] Job deleted successfully:', id);

    return NextResponse.json(
      { success: true, message: 'Job deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /jobs/[id] DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
