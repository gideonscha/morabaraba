// Records a player's arrival from the Worldplay DOI Return (/welcome).
//
// The game POSTs the DOI Return parameters it received (ei, tn, nt, sd,
// cl, ex, channel) plus its profile id when it has one. We log the event
// and link the MSISDN to the profile. The DOI outcome is a *claim* from
// the client: it may promote a brand-new or pending subscriber to
// 'active' (ei 0/41 = confirmed per spec), but it never overrides an
// 'unsubscribed' status — Worldplay's own notifications (wbi-notify)
// remain authoritative.
//
// Deployed with verify_jwt=false: players may not have a session yet.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...CORS, "Content-Type": "application/json" },
  });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MSISDN = /^(CTB:)?\d{6,15}$/i;
const str = (v: unknown, max = 64) => (typeof v === "string" && v.length <= max ? v : null);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: "Invalid JSON" }, 400);
  const b = body as Record<string, unknown>;

  const ei = typeof b.ei === "number" && Number.isInteger(b.ei) ? b.ei : null;
  if (ei === null) return json({ error: "ei required" }, 400);
  const confirmed = ei === 0 || ei === 41;
  const tnRaw = str(b.tn, 32);
  const msisdn = tnRaw && MSISDN.test(tnRaw) ? tnRaw : null;
  const profileId = str(b.profile_id, 36);
  const validProfile = profileId && UUID.test(profileId) ? profileId : null;
  const network = str(b.nt, 32);
  const service = str(b.cl, 64);
  const sd = str(b.sd, 10);
  const startDate = sd && /^\d{4}-\d{2}-\d{2}$/.test(sd) ? `${sd}T00:00:00+02:00` : null;
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  await supabase.from("wbi_events").insert({
    mt: "doiReturn",
    msisdn,
    service,
    operator: network?.toLowerCase() ?? null,
    ref_id: str(b.ex, 64),
    status_id: ei,
    status_message: str(b.em, 200),
    payload: {
      via: str(b.via, 16), ei, em: str(b.em, 200), tn: tnRaw, nt: network, sd,
      cl: service, ex: str(b.ex, 64), channel: str(b.channel, 32),
      profile_id: validProfile, client_at: str(b.at, 40),
    },
    source_ip: ip || null,
  });

  if (!msisdn) return json({ ok: true, linked: false, status: confirmed ? "confirmed" : "not_subscribed" });

  const { data: existing } = await supabase
    .from("wbi_subscribers").select("status, profile_id").eq("msisdn", msisdn).maybeSingle();

  let status = existing?.status ?? "pending";
  if (confirmed && status === "pending") status = "active";

  await supabase.from("wbi_subscribers").upsert({
    msisdn,
    service: service ?? undefined,
    operator: network?.toLowerCase() ?? undefined,
    status,
    subscribed_at: confirmed && !existing ? (startDate ?? new Date().toISOString()) : undefined,
    profile_id: validProfile ?? existing?.profile_id ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "msisdn" });

  return json({ ok: true, linked: Boolean(validProfile), status });
});
