import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Haversine formula to calculate distance between two lat/lng points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Development mode bypass - use service role key
    const isDevelopment = process.env.NODE_ENV === 'development';
    let supabase: any;

    if (isDevelopment) {
      console.log('[Technicians API] Dev mode: using service role key');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
      supabase = createClient(url, serviceKey);
    } else {
      supabase = createRouteHandlerClient({ cookies });

      // Get authenticated user (only in production)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get the job details to get job location
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('lat, lng')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('[Technicians API] Job not found:', jobId);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get the outreach record for this job
    const { data: outreach, error: outreachError } = await supabase
      .from('work_order_outreach')
      .select('id')
      .eq('job_id', jobId)
      .single();

    if (outreachError || !outreach) {
      console.log('[Technicians API] No outreach found for job:', jobId);
      return NextResponse.json({ technicians: [] }, { status: 200 });
    }

    // Get all recipients for this outreach with technician details
    const { data: recipients, error: recipientsError } = await supabase
      .from('work_order_recipients')
      .select(`
        id,
        technician_id,
        email_sent,
        dispatch_method,
        technicians (
          id,
          full_name,
          trade_needed,
          city,
          state,
          lat,
          lng,
          average_rating,
          signed_up
        )
      `)
      .eq('outreach_id', outreach.id);

    if (recipientsError) {
      console.error('[Technicians API] Error fetching recipients:', recipientsError);
      return NextResponse.json({ error: 'Failed to fetch technicians' }, { status: 500 });
    }

    // Transform the data to match the expected format
    const technicians = (recipients || []).map((recipient: any) => {
      const tech = recipient.technicians;

      // Calculate distance from job location to technician
      const distance = calculateDistance(
        job.lat || 0,
        job.lng || 0,
        tech.lat || 0,
        tech.lng || 0
      );

      return {
        id: tech.id,
        name: tech.full_name,
        trade: tech.trade_needed,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
        rating: tech.average_rating || 4.5,
        skills: [tech.trade_needed], // Could expand this with actual skills
        location: {
          lat: tech.lat,
          lng: tech.lng,
          city: tech.city,
          state: tech.state
        },
        dispatchMethod: recipient.dispatch_method,
        emailSent: recipient.email_sent,
        signedUp: tech.signed_up
      };
    });

    return NextResponse.json({ technicians }, { status: 200 });

  } catch (error: any) {
    console.error('[Technicians API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
