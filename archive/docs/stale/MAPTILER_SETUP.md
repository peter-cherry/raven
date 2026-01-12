> Archived on 2026-01-12 from MAPTILER_SETUP.md. Reason: Historical setup documentation

# MapTiler API Key Setup

## Problem
The demo tiles (`https://demotiles.maplibre.org/style.json`) only contain country-level data (coastlines, country borders) and don't include city streets or buildings.

## Solution
Get a **free MapTiler API key** to access detailed street-level vector tiles:

1. Go to https://cloud.maptiler.com/auth/widget
2. Sign up for free (no credit card required)
3. Create a new API key
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_MAPTILER_KEY=your_api_key_here
   ```

## Alternative: Use OSM Raster Tiles
If you don't want to sign up, we can use OpenStreetMap raster tiles with a purple filter overlay, but this won't give us precise purple roads - it will tint the entire map.

## Free Tier Limits
MapTiler free tier: 100,000 tile requests/month (plenty for development)

