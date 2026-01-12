import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const jobId = params.id;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      technician_id,
      quality_rating,
      professionalism_rating,
      timeliness_rating,
      communication_rating,
      feedback_text
    } = body;

    // Validate required fields
    if (!technician_id || !quality_rating || !professionalism_rating || !timeliness_rating || !communication_rating) {
      return NextResponse.json(
        { error: 'Missing required rating fields' },
        { status: 400 }
      );
    }

    // Validate rating values (1-5)
    const ratings = [quality_rating, professionalism_rating, timeliness_rating, communication_rating];
    if (ratings.some(r => r < 1 || r > 5)) {
      return NextResponse.json(
        { error: 'Ratings must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get job details to verify ownership and get org_id
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('org_id, created_by, job_status')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this job (created by them or in their org)
    const { data: orgMember } = await supabase
      .from('org_memberships')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('org_id', job.org_id)
      .single();

    if (!orgMember && job.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if rating already exists for this job
    const { data: existingRating } = await supabase
      .from('job_ratings')
      .select('id')
      .eq('job_id', jobId)
      .single();

    if (existingRating) {
      return NextResponse.json(
        { error: 'Job has already been rated' },
        { status: 409 }
      );
    }

    // Insert rating (overall_rating will be calculated by trigger)
    const { data: rating, error: ratingError } = await supabase
      .from('job_ratings')
      .insert({
        job_id: jobId,
        technician_id,
        rated_by: user.id,
        org_id: job.org_id,
        quality_rating,
        professionalism_rating,
        timeliness_rating,
        communication_rating,
        feedback_text: feedback_text || null,
        overall_rating: 0 // Will be calculated by trigger
      })
      .select()
      .single();

    if (ratingError) {
      console.error('[RATING] Error inserting rating:', ratingError);
      return NextResponse.json(
        { error: 'Failed to submit rating', details: ratingError.message },
        { status: 500 }
      );
    }

    console.log('[RATING] Rating submitted successfully:', rating.id);

    return NextResponse.json({
      success: true,
      rating
    });

  } catch (error) {
    console.error('[RATING] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if job has been rated
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const jobId = params.id;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if rating exists
    const { data: rating, error: ratingError } = await supabase
      .from('job_ratings')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (ratingError && ratingError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[RATING] Error checking rating:', ratingError);
      return NextResponse.json(
        { error: 'Failed to check rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasRating: !!rating,
      rating: rating || null
    });

  } catch (error) {
    console.error('[RATING] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
