import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobData = await request.json();

    console.log('[Job Creation API] User:', user.id, 'Email:', user.email);
    console.log('[Job Creation API] Org ID:', jobData.org_id);

    // Insert job with authenticated context
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        org_id: jobData.org_id,
        job_title: jobData.job_title,
        description: jobData.description,
        trade_needed: jobData.trade_needed,
        required_certifications: jobData.required_certifications ?? [],
        address_text: jobData.address_text,
        city: jobData.city,
        state: jobData.state,
        lat: jobData.lat,
        lng: jobData.lng,
        scheduled_at: jobData.scheduled_at,
        duration: jobData.duration,
        urgency: jobData.urgency,
        budget_min: jobData.budget_min,
        budget_max: jobData.budget_max,
        pay_rate: jobData.pay_rate,
        contact_name: jobData.contact_name,
        contact_phone: jobData.contact_phone,
        contact_email: jobData.contact_email,
        policy_id: jobData.policy_id || null,
        job_status: 'matching',
        created_by_user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('[Job Creation API] Database error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('[Job Creation API] Job created successfully:', job.id);
    return NextResponse.json({ job }, { status: 200 });

  } catch (error: any) {
    console.error('[Job Creation API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
