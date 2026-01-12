import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const technicianId = params.id;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all ratings for this technician
    const { data: ratings, error: ratingsError } = await supabase
      .from('job_ratings')
      .select('*')
      .eq('technician_id', technicianId)
      .order('created_at', { ascending: false });

    if (ratingsError) {
      console.error('[RATINGS] Error fetching ratings:', ratingsError);
      return NextResponse.json(
        { error: 'Failed to fetch ratings' },
        { status: 500 }
      );
    }

    if (!ratings || ratings.length === 0) {
      return NextResponse.json({
        totalRatings: 0,
        averageOverall: 0,
        averageQuality: 0,
        averageProfessionalism: 0,
        averageTimeliness: 0,
        averageCommunication: 0,
        ratings: []
      });
    }

    // Calculate averages
    const totalRatings = ratings.length;
    const averageOverall = ratings.reduce((sum, r) => sum + parseFloat(r.overall_rating), 0) / totalRatings;
    const averageQuality = ratings.reduce((sum, r) => sum + r.quality_rating, 0) / totalRatings;
    const averageProfessionalism = ratings.reduce((sum, r) => sum + r.professionalism_rating, 0) / totalRatings;
    const averageTimeliness = ratings.reduce((sum, r) => sum + r.timeliness_rating, 0) / totalRatings;
    const averageCommunication = ratings.reduce((sum, r) => sum + r.communication_rating, 0) / totalRatings;

    return NextResponse.json({
      totalRatings,
      averageOverall: Math.round(averageOverall * 10) / 10,
      averageQuality: Math.round(averageQuality * 10) / 10,
      averageProfessionalism: Math.round(averageProfessionalism * 10) / 10,
      averageTimeliness: Math.round(averageTimeliness * 10) / 10,
      averageCommunication: Math.round(averageCommunication * 10) / 10,
      ratings: ratings.slice(0, 10) // Return last 10 ratings
    });

  } catch (error) {
    console.error('[RATINGS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
