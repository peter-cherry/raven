import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function findTargetByEmail(email: string) {
  const { data } = await supabase
    .from("outreach_targets")
    .select("id, campaign_id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  try {
    const event = await req.json();
    const type = event.event_type ?? event.type ?? "";
    const email = event.email ?? event.recipient ?? "";

    if (!email) return new Response(JSON.stringify({ ok: true }), { status: 200 });

    const target = await findTargetByEmail(email);

    if (type === "email.opened" || type === "opened") {
      if (target) {
        await supabase.from("outreach_tracking_events").insert({ target_id: target.id, event_type: "open", user_agent: event.user_agent ?? null, ip_address: event.ip_address ?? null });
      }
    } else if (type === "email.clicked" || type === "clicked") {
      if (target) {
        await supabase.from("outreach_tracking_events").insert({ target_id: target.id, event_type: "click", clicked_url: event.link_url ?? event.url ?? null, user_agent: event.user_agent ?? null, ip_address: event.ip_address ?? null });
      }
    } else if (type === "email.replied" || type === "replied") {
      if (target) {
        await supabase.from("outreach_targets").update({ status: "replied" }).eq("id", target.id);
      }
    } else if (type === "email.bounced" || type === "bounced") {
      if (target) {
        await supabase.from("outreach_targets").update({ status: "bounced" }).eq("id", target.id);
      }
    } else if (type === "lead.unsubscribed" || type === "unsubscribed") {
      await supabase.from("outreach_unsubscribes").insert({ email, reason: event.reason ?? null });
      await supabase.from("outreach_targets").update({ status: "unsubscribed" }).eq("email", email);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
