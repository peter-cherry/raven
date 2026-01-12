import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Default dev org ID - matches the one used in page.tsx
const DEV_ORG_ID = '152ca2e3-a371-4167-99c5-0890afcd83d7';
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function POST(request: NextRequest) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
    let supabase: any;
    let userId: string;

    // Always use service role in development to bypass RLS
    if (isDevelopment) {
      console.log('[create-empty] Dev mode: using service role key');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!url || !serviceKey) {
        console.error('[create-empty] Missing Supabase env vars');
        return NextResponse.json({ 
          error: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY' 
        }, { status: 500 });
      }
      
      supabase = createClient(url, serviceKey);
      userId = DEV_USER_ID;
    } else {
      const cookieStore = cookies();
      supabase = createRouteHandlerClient({ cookies: () => cookieStore });

      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    }

    const { org_id: requestedOrgId } = await request.json();
    
    // Use provided org_id or fallback to dev org in development
    const org_id = requestedOrgId || (isDevelopment ? DEV_ORG_ID : null);

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    // In development, ensure the org exists (create if needed)
    if (isDevelopment) {
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', org_id)
        .single();
      
      if (!existingOrg) {
        console.log('[create-empty] Dev mode: creating default org');
        const { error: orgError } = await supabase
          .from('organizations')
          .upsert({
            id: org_id,
            name: 'Development Organization',
            created_at: new Date().toISOString()
          }, { onConflict: 'id' });
        
        if (orgError) {
          console.error('[create-empty] Failed to create dev org:', orgError);
        }
      }
    }

    // Create empty job with placeholder values for required NOT NULL columns
    // These will be populated when the job is parsed from raw text
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        org_id,
        job_status: 'pending',
        created_by: userId,
        job_title: 'Pending Work Order',
        trade_needed: 'TBD',
        address_text: 'TBD',
        contact_name: 'TBD',
        contact_phone: 'TBD',
        contact_email: 'TBD',
        lat: 0,
        lng: 0
      })
      .select('id')
      .single();

    if (error) {
      console.error('[create-empty] Error creating job:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      job_id: job.id
    });

  } catch (err) {
    console.error('[create-empty] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
