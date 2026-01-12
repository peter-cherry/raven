import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const INSTANTLY_API_KEY = Deno.env.get("INSTANTLY_API_KEY");

const CAM_HANDYMAN = Deno.env.get("INSTANTLY_CAMPAIGN_ID_HANDYMAN") ?? "";
const CAM_HVAC = Deno.env.get("INSTANTLY_CAMPAIGN_ID_HVAC") ?? "";
const CAM_PLUMBING = Deno.env.get("INSTANTLY_CAMPAIGN_ID_PLUMBING") ?? "";
const CAM_ELECTRICAL = Deno.env.get("INSTANTLY_CAMPAIGN_ID_ELECTRICAL") ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const campaignByTrade: Record<string, string> = {
  Handyman: CAM_HANDYMAN,
  HVAC: CAM_HVAC,
  Plumbing: CAM_PLUMBING,
  Electrical: CAM_ELECTRICAL,
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  if (!INSTANTLY_API_KEY) return new Response("Missing INSTANTLY_API_KEY", { status: 500 });

  try {
    const { campaignId } = await req.json();
    if (!campaignId) return new Response("campaignId required", { status: 400 });

    const { data: targets } = await supabase
      .from("outreach_targets")
      .select("id,email,contact_name,business_name,city,state,trade_type")
      .eq("campaign_id", campaignId)
      .eq("status", "queued")
      .eq("email_verified", true);

    const byTrade: Record<string, any[]> = {};
    for (const t of targets ?? []) {
      if (!byTrade[t.trade_type]) byTrade[t.trade_type] = [];
      byTrade[t.trade_type].push(t);
    }

    let uploaded = 0;

    for (const [trade, items] of Object.entries(byTrade)) {
      const campaign_id = campaignByTrade[trade];
      if (!campaign_id) continue;

      for (const t of items) {
        const firstName = (t.contact_name?.split(" ")[0]) ?? "";
        const lastName = (t.contact_name?.split(" ")[1]) ?? "";
        const body = {
          api_key: INSTANTLY_API_KEY,
          campaign_id,
          email: t.email,
          first_name: firstName,
          last_name: lastName,
          company_name: t.business_name ?? "",
          personalization: {
            city: t.city ?? "",
            state: t.state ?? "",
            trade: trade,
            business_name: t.business_name ?? "",
          },
          variables: {
            signup_link: `https://yourplatform.com/signup?campaign_id=${campaignId}&target_id=${t.id}&trade=${encodeURIComponent(trade)}`,
          },
        };

        const res = await fetch("https://api.instantly.ai/api/v1/lead/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          await supabase.from("outreach_targets").update({ status: "sent", first_sent_at: new Date().toISOString(), emails_sent_count: 1 }).eq("id", t.id);
          await supabase.from("outreach_sent_emails").insert({ campaign_id: campaignId, target_id: t.id, sequence_step: 1, to_email: t.email, subject: `Intro for ${trade}` });
          uploaded++;
        }
        await new Promise(r => setTimeout(r, 120));
      }
    }

    return new Response(JSON.stringify({ success: true, uploaded }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
