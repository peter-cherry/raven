import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Playwright-based Web Scraper for Technician Data
 *
 * Scrapes Google Search results for technicians in specific locations
 * Supports: Handyman, HVAC, Plumbing, Electrical trades
 *
 * Usage:
 * POST /scrape-with-playwright
 * Body: { trade: "HVAC", city: "Los Angeles", state: "CA", maxResults: 20 }
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Trade-specific search terms
const TRADE_TERMS: Record<string, string[]> = {
  Handyman: ["handyman services", "handyman", "home repair services"],
  HVAC: ["HVAC contractor", "air conditioning repair", "heating repair"],
  Plumbing: ["plumber", "plumbing services", "emergency plumber"],
  Electrical: ["electrician", "electrical contractor", "electrical services"],
};

interface ScrapedBusiness {
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
}

/**
 * Scrape Google Search Results using Playwright
 */
async function scrapeGoogleSearch(
  trade: string,
  city: string,
  state: string,
  maxResults: number
): Promise<ScrapedBusiness[]> {
  const results: ScrapedBusiness[] = [];
  const searchTerms = TRADE_TERMS[trade] || [trade.toLowerCase()];

  // Import playwright-chromium dynamically
  // Note: In Supabase Edge Functions, we'll use a serverless browser service
  // For local testing, you can use playwright directly

  try {
    // For now, we'll use fetch to scrape Google Search HTML
    // In production, you'd deploy this with a headless browser service like Browserless
    for (const term of searchTerms) {
      const query = encodeURIComponent(`${term} in ${city}, ${state}`);
      const url = `https://www.google.com/search?q=${query}`;

      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch: ${response.status}`);
        continue;
      }

      const html = await response.text();

      // Parse HTML to extract business information
      const businesses = parseGoogleSearchHTML(html, trade);
      results.push(...businesses);

      // Limit results
      if (results.length >= maxResults) {
        break;
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error("Scraping error:", error);
  }

  // Deduplicate by name + address
  const unique = Array.from(
    new Map(results.map((b) => [`${b.name}-${b.address}`, b])).values()
  );

  return unique.slice(0, maxResults);
}

/**
 * Parse Google Search HTML to extract business data
 */
function parseGoogleSearchHTML(
  html: string,
  trade: string
): ScrapedBusiness[] {
  const businesses: ScrapedBusiness[] = [];

  try {
    // Extract business names (looking for common patterns in Google results)
    const nameMatches = html.matchAll(
      /<h3[^>]*>([^<]+)<\/h3>|<span[^>]*class="[^"]*business[^"]*"[^>]*>([^<]+)<\/span>/gi
    );

    for (const match of nameMatches) {
      const name = (match[1] || match[2] || "").trim();

      if (name && name.length > 3 && name.length < 100) {
        businesses.push({
          name,
          address: null,
          phone: null,
          website: null,
          rating: null,
          reviewCount: null,
        });
      }
    }

    // Extract phone numbers
    const phoneMatches = html.matchAll(
      /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g
    );

    let phoneIndex = 0;
    for (const match of phoneMatches) {
      const phone = match[0].trim();
      if (businesses[phoneIndex]) {
        businesses[phoneIndex].phone = phone;
        phoneIndex++;
      }
    }

    // Extract addresses (basic pattern matching)
    const addressMatches = html.matchAll(
      /(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way)[,\s]+[A-Za-z\s]+,\s+[A-Z]{2}\s+\d{5})/gi
    );

    let addressIndex = 0;
    for (const match of addressMatches) {
      const address = match[0].trim();
      if (businesses[addressIndex]) {
        businesses[addressIndex].address = address;
        addressIndex++;
      }
    }
  } catch (error) {
    console.error("HTML parsing error:", error);
  }

  return businesses.filter((b) => b.name); // Only return businesses with names
}

/**
 * Alternative: Scrape using SerpAPI (paid service with structured data)
 */
async function scrapeSerpAPI(
  trade: string,
  city: string,
  state: string,
  maxResults: number
): Promise<ScrapedBusiness[]> {
  const apiKey = Deno.env.get("SERPAPI_KEY");

  if (!apiKey) {
    throw new Error("SERPAPI_KEY not configured");
  }

  const query = encodeURIComponent(`${trade} in ${city}, ${state}`);
  const url = `https://serpapi.com/search.json?engine=google_maps&q=${query}&api_key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`SerpAPI error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.local_results) {
    return [];
  }

  return data.local_results.slice(0, maxResults).map((result: any) => ({
    name: result.title || result.name,
    address: result.address,
    phone: result.phone,
    website: result.website,
    rating: result.rating,
    reviewCount: result.reviews,
  }));
}

/**
 * Insert scraped targets into database
 */
async function insertTargets(
  businesses: ScrapedBusiness[],
  trade: string,
  state: string
): Promise<{ inserted: number; duplicates: number }> {
  let inserted = 0;
  let duplicates = 0;

  for (const business of businesses) {
    // Extract city from address if available
    const city = business.address
      ? business.address.split(",")[1]?.trim()
      : null;

    const { error } = await supabase.from("outreach_targets").insert({
      source_table: "google_scrape",
      source_id: `google_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      business_name: business.name,
      address: business.address,
      phone: business.phone,
      website: business.website,
      city,
      state,
      trade_type: trade,
      status: "pending",
      email_found: false,
    });

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        duplicates++;
      } else {
        console.error("Insert error:", error);
      }
    } else {
      inserted++;
    }
  }

  return { inserted, duplicates };
}

/**
 * Main handler
 */
Deno.serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { trade, city, state, maxResults = 20, useSerpAPI = false } =
      await req.json();

    if (!trade || !city || !state) {
      return new Response("Missing required fields: trade, city, state", {
        status: 400,
      });
    }

    console.log(`Scraping ${trade} in ${city}, ${state}...`);

    // Choose scraping method
    let businesses: ScrapedBusiness[];

    if (useSerpAPI) {
      businesses = await scrapeSerpAPI(trade, city, state, maxResults);
    } else {
      businesses = await scrapeGoogleSearch(trade, city, state, maxResults);
    }

    console.log(`Found ${businesses.length} businesses`);

    // Insert into database
    const { inserted, duplicates } = await insertTargets(
      businesses,
      trade,
      state
    );

    return new Response(
      JSON.stringify({
        success: true,
        results_found: businesses.length,
        inserted,
        duplicates,
        businesses: businesses.slice(0, 5), // Return first 5 for preview
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Scraper error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
