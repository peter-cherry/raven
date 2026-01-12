import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const API_KEY = process.env.GOOGLE_MAPS_SERVER_KEY;
    if (!API_KEY) return NextResponse.json({ error: 'Missing Google Maps Server key' }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const origin = body?.origin as { lat: number; lng: number } | undefined;
    const destinations = body?.destinations as Array<{ lat: number; lng: number } | null> | undefined;
    if (!origin || !Array.isArray(destinations) || destinations.length === 0) {
      return NextResponse.json({ error: 'origin and destinations are required' }, { status: 400 });
    }

    const originsParam = `${origin.lat},${origin.lng}`;
    const destParam = destinations
      .map((d) => (d && Number.isFinite(d.lat) && Number.isFinite(d.lng) ? `${d.lat},${d.lng}` : ''))
      .filter(Boolean)
      .join('|');

    if (!destParam) return NextResponse.json({ error: 'No valid destinations' }, { status: 400 });

    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.set('origins', originsParam);
    url.searchParams.set('destinations', destParam);
    url.searchParams.set('mode', 'driving');
    url.searchParams.set('units', 'metric');
    url.searchParams.set('key', API_KEY);

    const resp = await fetch(url.toString());
    const data = await resp.json();
    if (!resp.ok || data.status !== 'OK') {
      return NextResponse.json({ error: data?.error_message || data?.status || 'Distance Matrix failed' }, { status: resp.status || 500 });
    }

    const elements = data.rows?.[0]?.elements || [];
    const results = elements.map((el: any, i: number) => {
      if (!el || el.status !== 'OK') return { index: i, status: el?.status || 'ZERO_RESULTS' };
      return {
        index: i,
        status: 'OK',
        distance_m: el.distance?.value ?? null,
        duration_sec: el.duration?.value ?? null,
      };
    });

    return NextResponse.json({ results }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Distance Matrix error' }, { status: 500 });
  }
}
