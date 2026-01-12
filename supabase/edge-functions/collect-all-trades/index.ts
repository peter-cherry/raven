import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const trades = [
  { type: "Handyman", terms: ["handyman services", "handyman", "home repair services", "property maintenance", "general contractor"] },
  { type: "HVAC", terms: ["HVAC technicians", "HVAC contractors", "air conditioning repair", "heating and cooling"] },
  { type: "Plumbing", terms: ["plumbing contractors", "plumbers", "plumbing services", "emergency plumber"] },
  { type: "Electrical", terms: ["electrical contractors", "electricians", "licensed electrician", "electrical services"] },
];

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function extractCity(address?: string | null): string | null {
  if (!address) return null;
  const parts = address.split(",").map(s => s.trim());
  if (parts.length >= 2) return parts[parts.length - 2];
  return null;
}

function extractState(address?: string | null): string | null {
  if (!address) return null;
  const m = address.match(/\b([A-Z]{2})\s\d{5}(-\d{4})?\b/);
  return m ? m[1] : null;
}

async function collectForTrade(city: string, state: string, trade: {type: string; terms: string[]}) {
  if (!GOOGLE_MAPS_API_KEY) throw new Error("Missing GOOGLE_MAPS_API_KEY");
  const results: any[] = [];
  for (const term of trade.terms) {
    const body = { textQuery: `${term} in ${city}, ${state}`, maxResultCount: 20 };
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Places API error (${res.status}): ${err}`);
    }
    const data = await res.json();
    if (data?.places?.length) {
      for (const p of data.places) {
        results.push({ ...p, trade: trade.type });
      }
    }
    await sleep(250);
  }
  // dedupe by id
  const map = new Map<string, any>();
  for (const r of results) map.set(r.id, r);
  return Array.from(map.values());
}

async function insertTargets(campaignId: string, items: any[]) {
  const batchSize = 100;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize).map((p) => ({
      campaign_id: campaignId,
      source_table: "google_maps",
      source_id: p.id,
      business_name: p.displayName?.text ?? null,
      address: p.formattedAddress ?? null,
      phone: p.internationalPhoneNumber ?? null,
      website: p.websiteUri ?? null,
      city: extractCity(p.formattedAddress),
      state: extractState(p.formattedAddress),
      trade_type: p.trade,
      status: "pending",
    }));
    const { error } = await supabase.from("outreach_targets").insert(batch);
    if (error && error.code !== "23505") throw error; // ignore duplicates
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  try {
    const { city, state, campaignId } = await req.json();
    if (!city || !state || !campaignId) return new Response("city, state, campaignId required", { status: 400 });

    let all: any[] = [];
    for (const t of trades) {
      const items = await collectForTrade(city, state, t);
      all = all.concat(items);
    }
    // dedupe again across trades
    const unique = Array.from(new Map(all.map(p => [p.id, p])).values());
    await insertTargets(campaignId, unique);

    return new Response(JSON.stringify({ success: true, inserted: unique.length }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
