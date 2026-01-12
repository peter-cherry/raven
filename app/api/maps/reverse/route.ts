import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (!lat || !lng) return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 });

    const key = process.env.GOOGLE_MAPS_SERVER_KEY;
    if (!key) return NextResponse.json({ error: 'Google Maps Server key not configured' }, { status: 500 });

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(lat + ',' + lng)}&result_type=locality&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK') {
      return NextResponse.json({ error: data.error_message || data.status }, { status: 400 });
    }

    const result = data.results?.[0];
    const comps = result?.address_components || [];
    const city = comps.find((c: any) => c.types?.includes('locality'))?.long_name ?? null;
    const state = comps.find((c: any) => c.types?.includes('administrative_area_level_1'))?.short_name ?? null;
    const address = [city, state].filter(Boolean).join(', ');

    return NextResponse.json({ address, city, state });
  } catch (e) {
    return NextResponse.json({ error: 'Reverse geocoding failed' }, { status: 500 });
  }
}
