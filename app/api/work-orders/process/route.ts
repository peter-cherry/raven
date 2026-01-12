import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { raw_work_order_id } = await request.json();

    if (!raw_work_order_id) {
      return NextResponse.json(
        { success: false, error: 'raw_work_order_id is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get the raw work order
    const { data: rawWO, error: fetchError } = await supabase
      .from('raw_work_orders')
      .select('*')
      .eq('id', raw_work_order_id)
      .single();

    if (fetchError || !rawWO) {
      return NextResponse.json(
        { success: false, error: 'Raw work order not found' },
        { status: 404 }
      );
    }

    // Call Claude parsing API
    const parseResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/work-orders/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawWO.raw_text }),
    });

    if (!parseResponse.ok) {
      const parseError = await parseResponse.json();
      await supabase
        .from('raw_work_orders')
        .update({
          status: 'failed',
          error_message: `Parsing failed: ${parseError.error}`,
        })
        .eq('id', raw_work_order_id);

      return NextResponse.json(
        { success: false, error: parseError.error || 'Parsing failed' },
        { status: 500 }
      );
    }

    const parseResult = await parseResponse.json();
    const parsedData = parseResult.data;

    // Update raw work order with parsed data
    await supabase
      .from('raw_work_orders')
      .update({
        status: 'parsed',
        parsed_data: parsedData,
      })
      .eq('id', raw_work_order_id);

    // Geocode address with fallbacks (Mapbox -> Google -> Nominatim)
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const googleKey = process.env.GOOGLE_MAPS_SERVER_KEY;
    let geoData = { city: null as string | null, state: null as string | null, lat: 0 as number, lng: 0 as number };

    const addr = parsedData.address_text;
    const tryMapbox = async () => {
      if (!mapboxToken || !addr) return false;
      try {
        const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addr)}.json?access_token=${mapboxToken}`);
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
      } catch {}
      return false;
    };
    const tryGoogle = async () => {
      // Use client-side API key which works with referer restrictions from server too
      const clientKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!clientKey || !addr) return false;
      try {
        const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${clientKey}`);
        const j = await r.json();
        console.log('[Process] Google geocode response:', j.status, j.error_message);
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
        console.log('[Process] Geocoded:', addr, '→', geoData.lat, geoData.lng);
        return true;
      } catch (e) {
        console.error('[Process] Google geocode error:', e);
      }
      return false;
    };
    const tryNominatim = async () => {
      if (!addr) return false;
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}`, { headers: { 'User-Agent': 'ravensearch-app/1.0' } });
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
      } catch {}
      return false;
    };

    // Try Nominatim first (free, no key), then Google (with client key), then Mapbox
    await (tryNominatim() || tryGoogle() || tryMapbox());

    const toNum = (v: any) => typeof v === 'number' ? v : Number(String(v ?? '').replace(/[^0-9.]/g, '')) || 0;

    // Create job record with parsed data (coerce numeric fields)
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        org_id: rawWO.org_id,
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
        job_status: 'matching',
        status: 'pending',
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Job creation error:', jobError);
      await supabase
        .from('raw_work_orders')
        .update({
          status: 'failed',
          error_message: `Job creation failed: ${jobError?.message}`,
        })
        .eq('id', raw_work_order_id);

      return NextResponse.json(
        { success: false, error: 'Failed to create job' },
        { status: 500 }
      );
    }

    // Link raw work order to job
    await supabase
      .from('raw_work_orders')
      .update({
        status: 'job_created',
        job_id: job.id,
      })
      .eq('id', raw_work_order_id);

    // Call find_matching_technicians RPC
    try {
      await supabase.rpc('find_matching_technicians', {
        p_job_id: job.id,
        p_lat: geoData.lat,
        p_lng: geoData.lng,
        p_trade: parsedData.trade_needed,
        p_state: geoData.state,
        p_max_distance_m: 10000,
      });
    } catch (err) {
      console.error('Technician matching error:', err);
      // Don't fail - the matching might work differently
    }

    return NextResponse.json(
      {
        success: true,
        job_id: job.id,
        parsed_data: parsedData,
        message: 'Work order processed successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Process API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
