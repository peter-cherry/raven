import { NextRequest } from 'next/server';

// Simple in-memory cache with 24h TTL per address
const cache = new Map<string, { uri: string; expiresAt: number }>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address') || searchParams.get('q');
  if (!address) {
    return new Response(JSON.stringify({ error: 'Missing address parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const key = address.trim();
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) {
    return new Response(JSON.stringify({ uri: hit.uri, cached: true, ttl: hit.expiresAt - now }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } });
  }

  const API_KEY = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Google Maps Server key' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const url = new URL('https://aerialview.googleapis.com/v1/videos:lookupVideo');
  url.searchParams.set('address', key);
  url.searchParams.set('key', API_KEY);

  try {
    const resp = await fetch(url.toString());
    const data = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data?.error?.message || 'Aerial View lookup failed' }), { status: resp.status, headers: { 'Content-Type': 'application/json' } });
    }
    if (data?.state === 'PROCESSING') {
      return new Response(JSON.stringify({ error: 'Aerial video is processing' }), { status: 202, headers: { 'Content-Type': 'application/json' } });
    }
    const uri = data?.uris?.MP4_HIGH?.landscapeUri || data?.uris?.MP4_MEDIUM?.landscapeUri || data?.uris?.MP4_LOW?.landscapeUri;
    if (!uri) {
      return new Response(JSON.stringify({ error: 'Aerial video not available' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    // Cache for 24h
    const expiresAt = now + 24 * 60 * 60 * 1000;
    cache.set(key, { uri, expiresAt });
    return new Response(JSON.stringify({ uri, cached: false, ttl: expiresAt - now }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Network error loading Aerial View' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}
