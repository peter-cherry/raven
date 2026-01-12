import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    if (!q) return NextResponse.json({ error: 'Missing q' }, { status: 400 });

    // Use Google Maps Geocoding API with server-side key (secure, no referrer restrictions)
    const googleKey = process.env.GOOGLE_MAPS_SERVER_KEY;
    if (googleKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${googleKey}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'OK' && data.results?.[0]) {
          const result = data.results[0];

          // Validate that the result is a legitimate address, not a random location
          // Google sometimes returns results even for nonsense input
          const hasStreetAddress = result.address_components?.some((c: any) =>
            c.types?.includes('street_number') || c.types?.includes('route')
          );

          if (!hasStreetAddress) {
            console.warn('[Geocode API] Google result missing street address:', result.formatted_address);
            // Fall through to Nominatim
          } else {
            const loc = result.geometry.location;
            const comps = result.address_components || [];
            const city = comps.find((c: any) => c.types?.includes('locality'))?.long_name ?? null;

            // Get the state component
            const stateComponent = comps.find((c: any) => c.types?.includes('administrative_area_level_1'));

            // Database expects 2-letter state codes, not full names
            // Always use short_name (abbreviation) from Google
            let state = null;
            if (stateComponent) {
              // Use short_name which is the 2-letter abbreviation (CA, NY, TX, etc.)
              state = stateComponent.short_name;

              // Debug logging
              console.log('[Geocode API] State component:', {
                long_name: stateComponent.long_name,
                short_name: stateComponent.short_name,
                types: stateComponent.types,
                final_state: state
              });
            }

            console.log('[Geocode API] Google success:', q, '→', loc.lat, loc.lng, 'State:', state);

            return NextResponse.json({
              lat: loc.lat,
              lng: loc.lng,
              city,
              state
            });
          }
        } else {
          console.warn('[Geocode API] Google returned:', data.status, data.error_message);
        }
      } catch (e) {
        console.error('[Geocode API] Google error:', e);
      }
    }

    // Fallback to Nominatim if Google fails
    const parts = q.split(',').map(p => p.trim());
    const queries = [
      q,
      parts.slice(-2).join(', '),
      parts.slice(-2, -1).join(', ')
    ];

    for (const query of queries) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'ravensearch-app/1.0',
            'Accept': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const result = data[0];
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);

            console.log('[Geocode API] Nominatim fallback:', query, '→', lat, lng);

            return NextResponse.json({
              lat,
              lng,
              city: null,
              state: null
            });
          }
        }
      } catch (e) {
        continue;
      }
    }

    console.warn('[Geocode API] No results for:', q);
    return NextResponse.json({ error: 'No results found' }, { status: 404 });

  } catch (e: any) {
    console.error('[Geocode API] Exception:', e);
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
