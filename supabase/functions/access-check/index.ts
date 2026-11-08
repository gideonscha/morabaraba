// Subscriber access check for gated instances (Kraal Boss / MTN).
//
// Jacqui (6–8 Nov 2026): the MTN game is closed to anyone we have not
// received a subscribe notification for. Billing happens at bundle
// level, so there is no billing event to wait for — the tnSubscribe
// notification (recorded in wbi_subscribers by wbi-notify) is the
// grant, and tnUnsubscribe revokes it.
//
// POST { brand, msisdn } → { granted, status, reason }
// Deployed with verify_jwt=false: the player has no session yet.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const MSISDN = /^(CTB:)?\d{6,15}$/i;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return json({ error: "Invalid JSON" }, 400);

  const msisdn = typeof b.msisdn === "string" && MSISDN.test(b.msisdn.trim()) ? b.msisdn.trim() : null;
  const brand = typeof b.brand === "string" ? b.brand : "unknown";
  if (!msisdn) return json({ granted: false, status: "none", reason: "no_msisdn", brand });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: sub, error } = await supabase
    .from("wbi_subscribers").select("status, operator, service").eq("msisdn", msisdn).maybeSingle();
  if (error) return json({ granted: false, status: "error", reason: error.message, brand }, 500);
  if (!sub) return json({ granted: false, status: "none", reason: "no_subscription_notification", brand });

  const granted = sub.status === "active";
  return json({ granted, status: sub.status, reason: granted ? null : `status_${sub.status}`, brand,
                operator: sub.operator, service: sub.service });
});
