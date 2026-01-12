import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const HUNTER_API_KEY = Deno.env.get("HUNTER_API_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function extractDomain(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function hunterDomainSearch(domain: string) {
  if (!HUNTER_API_KEY) return { emails: [] };
  const res = await fetch(`https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${HUNTER_API_KEY}`);
  if (!res.ok) return { emails: [] };
  const data = await res.json();
  return { emails: (data?.data?.emails ?? []).map((e: any) => ({ value: e.value, type: e.type, confidence: e.confidence })) };
}

async function hunterVerify(email: string) {
  if (!HUNTER_API_KEY) return { status: "risky" };
  const res = await fetch(`https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${HUNTER_API_KEY}`);
  if (!res.ok) return { status: "risky" };
  const data = await res.json();
  return { status: data?.data?.status ?? "risky" };
}

function extractEmailsFromHtml(html: string): string[] {
  const set = new Set<string>();
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g;
  const matches = html.match(re) ?? [];
  for (const m of matches) {
    const lowered = m.toLowerCase();
    if (!lowered.includes("example") && !lowered.endsWith("@localhost")) set.add(lowered);
  }
  return Array.from(set);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  try {
    const { campaignId, limit } = await req.json();
    if (!campaignId) return new Response("campaignId required", { status: 400 });
    const lim = typeof limit === "number" && limit > 0 ? Math.min(limit, 200) : 100;

    const { data: targets } = await supabase
      .from("outreach_targets")
      .select("id,business_name,website,trade_type")
      .eq("campaign_id", campaignId)
      .eq("email_found", false)
      .not("website", "is", null)
      .limit(lim);

    const processed: any[] = [];

    for (const t of targets ?? []) {
      try {
        let foundEmail: string | null = null;
        let source: string | null = null;
        const domain = t.website ? extractDomain(t.website) : null;

        if (domain) {
          const domainRes = await hunterDomainSearch(domain);
          if (domainRes.emails.length > 0) {
            foundEmail = domainRes.emails.sort((a: any, b: any) => (b.confidence ?? 0) - (a.confidence ?? 0))[0].value;
            source = "hunter";
          }
        }

        if (!foundEmail && t.website) {
          const res = await fetch(t.website, { redirect: "follow" });
          if (res.ok) {
            const html = await res.text();
            const emails = extractEmailsFromHtml(html);
            foundEmail = emails[0] ?? null;
            source = foundEmail ? "scraped" : null;
          }
        }

        if (foundEmail) {
          const ver = await hunterVerify(foundEmail);
          if (ver.status === "valid") {
            const { error } = await supabase
              .from("outreach_targets")
              .update({ email: foundEmail, email_found: true, email_verified: true, email_source: source, status: "queued" })
              .eq("id", t.id);
            if (error) throw error;
            processed.push({ id: t.id, email: foundEmail });
          }
        }
        await new Promise(r => setTimeout(r, 400));
      } catch (e) {
        // continue to next target
      }
    }

    return new Response(JSON.stringify({ success: true, enriched: processed.length }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
