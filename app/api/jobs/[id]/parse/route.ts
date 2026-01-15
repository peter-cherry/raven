import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Check if we should use mock mode (no Supabase configured)
function shouldUseMockMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
  return mockMode || !url || !serviceKey;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const { raw_text } = await request.json();

    if (!raw_text || !raw_text.trim()) {
      return NextResponse.json(
        { success: false, error: 'raw_text is required' },
        { status: 400 }
      );
    }

    // Mock mode - return fake parsed data for testing without database
    if (shouldUseMockMode() || jobId.startsWith('mock-job-')) {
      console.log('[parse] Mock mode: returning fake parsed data');
      
      // Call parsing API to get real AI-parsed data (if available) or use mock
      let parsedData = {
        job_title: 'Mock Work Order',
        description: raw_text.substring(0, 200),
        trade_needed: 'General',
        address_text: '123 Main St, Austin, TX 78701',
        scheduled_start_ts: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 120,
        urgency: 'normal',
        budget_min: 100,
        budget_max: 500,
        pay_rate: null,
        contact_name: 'John Doe',
        contact_phone: '555-123-4567',
        contact_email: 'john@example.com'
      };

      // Try to get real parsed data from the parse API
      try {
        const parseResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/work-orders/parse`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw_text }),
          }
        );
        
        if (parseResponse.ok) {
          const parseResult = await parseResponse.json();
          if (parseResult.data) {
            parsedData = { ...parsedData, ...parseResult.data };
          }
        }
      } catch (e) {
        console.log('[parse] Mock mode: parsing API not available, using defaults');
      }

      return NextResponse.json({
        success: true,
        job_id: jobId,
        parsed_data: parsedData,
        geo_data: { lat: 30.2672, lng: -97.7431, city: 'Austin', state: 'TX' },
        message: 'Mock job parsed successfully',
        mock: true
      });
    }

    // Development mode bypass - use service role key
    const isDevelopment = process.env.NODE_ENV === 'development';
    let supabase: any;

    if (isDevelopment) {
      console.log('[parse] Dev mode: using service role key');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
      supabase = createClient(url, serviceKey);
    } else {
      const cookieStore = cookies();
      supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    }

    // Verify job exists
    const { data: existingJob, error: jobFetchError } = await supabase
      .from('jobs')
      .select('id, org_id')
      .eq('id', jobId)
      .single();

    if (jobFetchError || !existingJob) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Call parsing API
    const parseResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/work-orders/parse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text }),
      }
    );

    if (!parseResponse.ok) {
      const parseError = await parseResponse.json();
      return NextResponse.json(
        { success: false, error: parseError.error || 'Parsing failed' },
        { status: 500 }
      );
    }

    const parseResult = await parseResponse.json();
    const parsedData = parseResult.data;

    // Geocode address with fallbacks (Nominatim -> Google -> Mapbox)
    let geoData = { city: null as string | null, state: null as string | null, lat: 0, lng: 0 };
    const addr = parsedData.address_text;

    const tryNominatim = async () => {
      if (!addr) return false;
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}`,
          { headers: { 'User-Agent': 'ravensearch-app/1.0' } }
        );
        const j = await r.json();
        const res = j?.[0];
        if (!res) return false;
        geoData = {
          lat: Number(res.lat) || 0,
          lng: Number(res.lon) || 0,
          city: null,
          state: null,
        };
        return true;
      } catch {
        return false;
      }
    };

    const tryGoogle = async () => {
      const clientKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!clientKey || !addr) return false;
      try {
        const r = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${clientKey}`
        );
        const j = await r.json();
        const res = j?.results?.[0];
        if (!res) return false;
        const loc = res.geometry?.location;
        const comps = res.address_components || [];
        geoData = {
          lat: loc?.lat ?? 0,
          lng: loc?.lng ?? 0,
          city: comps.find((c: any) => c.types?.includes('locality'))?.long_name ?? null,
          state: comps.find((c: any) => c.types?.includes('administrative_area_level_1'))?.short_name ?? null,
        };
        return true;
      } catch {
        return false;
      }
    };

    const tryMapbox = async () => {
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!mapboxToken || !addr) return false;
      try {
        const r = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addr)}.json?access_token=${mapboxToken}`
        );
        const j = await r.json();
        const f = j?.features?.[0];
        if (!f) return false;
        geoData = {
          lat: f.center?.[1] ?? 0,
          lng: f.center?.[0] ?? 0,
          city: f.context?.find((c: any) => c.id?.startsWith('place'))?.text ?? null,
          state: f.context?.find((c: any) => c.id?.startsWith('region'))?.short_code?.split('-')[1] ?? null,
        };
        return true;
      } catch {
        return false;
      }
    };

    // Try geocoding in order - must chain properly for async functions
    const nominatimSuccess = await tryNominatim();
    if (!nominatimSuccess) {
      const googleSuccess = await tryGoogle();
      if (!googleSuccess) {
        await tryMapbox();
      }
    }

    console.log('[parse] Geocoding result:', geoData);

    const toNum = (v: any) =>
      typeof v === 'number' ? v : Number(String(v ?? '').replace(/[^0-9.]/g, '')) || 0;

    // Update the existing job with parsed data
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        job_title: parsedData.job_title,
        description: parsedData.description,
        trade_needed: parsedData.trade_needed,
        address_text: parsedData.address_text,
        city: geoData.city,
        state: geoData.state,
        lat: geoData.lat,
        lng: geoData.lng,
        scheduled_at: parsedData.scheduled_start_ts,
        duration: parsedData.duration,
        urgency: parsedData.urgency,
        budget_min: toNum(parsedData.budget_min),
        budget_max: toNum(parsedData.budget_max),
        pay_rate: parsedData.pay_rate,
        contact_name: parsedData.contact_name,
        contact_phone: parsedData.contact_phone,
        contact_email: parsedData.contact_email,
        job_status: 'matching', // Upgrade from 'pending'
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('[parse] Error updating job:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Trigger technician matching (optional - don't fail if it errors)
    try {
      await supabase.rpc('find_matching_technicians', {
        p_job_id: jobId,
        p_lat: geoData.lat,
        p_lng: geoData.lng,
        p_trade: parsedData.trade_needed,
        p_state: geoData.state,
        p_max_distance_m: 10000,
      });
    } catch (err) {
      console.error('[parse] Technician matching error:', err);
      // Don't fail - matching is optional
    }

    // Note: Dispatch is now triggered by the frontend after job creation
    // The frontend calls POST /api/jobs/{id}/dispatch when the user submits

    return NextResponse.json({
      success: true,
      job_id: jobId,
      parsed_data: parsedData,
      geo_data: geoData,
      message: 'Job updated with parsed data',
    });

  } catch (error) {
    console.error('[parse] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
