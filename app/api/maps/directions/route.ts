import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origin = searchParams.get('origin'); // "lat,lng"
  const destination = searchParams.get('destination'); // "lat,lng"

  if (!origin || !destination) {
    return NextResponse.json(
      { error: 'Origin and destination are required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    console.log('[Directions API] Origin:', origin, 'Destination:', destination);
    console.log('[Directions API] Response status:', data.status);

    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const polyline = route.overview_polyline.points;

      return NextResponse.json({
        success: true,
        polyline,
        distance: route.legs[0].distance,
        duration: route.legs[0].duration
      });
    } else {
      console.error('[Directions API] Error:', data.status, data.error_message);
      return NextResponse.json(
        { error: data.status, message: data.error_message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Directions API] Exception:', error);
    return NextResponse.json(
      { error: 'Failed to fetch directions' },
      { status: 500 }
    );
  }
}
