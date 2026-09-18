// Records a player's arrival from the Worldplay DOI Return (/welcome).
//
// The game POSTs the DOI Return parameters it received (ei, tn, nt, sd,
// cl, ex, channel) plus its profile id when it has one. We log the event
// and link the MSISDN to the profile (both wbi_subscribers.profile_id and
// profiles.msisdn). The DOI outcome is a *claim* from the client: it may
// promote a brand-new or pending subscriber to 'active' (ei 0/41 =
// confirmed per spec), but it never overrides an 'unsubscribed' status —
// Worldplay's own notifications (wbi-notify) remain authoritative.
//
// Linking is defensive: the profile must exist server-side (a device can
// hold an id whose row was never created) and the MSISDN must not already
// belong to another profile (profiles.msisdn is unique — one account per
// number). Failures are reported, never thrown.
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
  const profileIdRaw = str(b.profile_id, 36);
  const claimedProfile = profileIdRaw && UUID.test(profileIdRaw) ? profileIdRaw : null;
  const network = str(b.nt, 32);
  const service = str(b.cl, 64);
  const sd = str(b.sd, 10);
  const startDate = sd && /^\d{4}-\d{2}-\d{2}$/.test(sd) ? `${sd}T00:00:00+02:00` : null;
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const nowIso = new Date().toISOString();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Only link to a profile that really exists server-side.
  let profileId: string | null = null;
  if (claimedProfile) {
    const { data: prof } = await supabase.from("profiles").select("id").eq("id", claimedProfile).maybeSingle();
    profileId = prof?.id ?? null;
  }

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
      profile_id: claimedProfile, profile_exists: claimedProfile ? Boolean(profileId) : null,
      client_at: str(b.at, 40),
    },
    source_ip: ip || null,
  });

  if (!msisdn) {
    return json({ ok: true, linked: false, reason: "no_msisdn", status: confirmed ? "confirmed" : "not_subscribed" });
  }

  const { data: existing } = await supabase
    .from("wbi_subscribers").select("status, profile_id").eq("msisdn", msisdn).maybeSingle();

  let status = existing?.status ?? "pending";
  if (confirmed && status === "pending") status = "active";

  // Does this number already belong to a different profile? One account per number.
  let linkReason: string | null = null;
  if (profileId) {
    const { data: owner } = await supabase.from("profiles").select("id").eq("msisdn", msisdn).maybeSingle();
    if (owner && owner.id !== profileId) { linkReason = "msisdn_owned_by_other_profile"; profileId = null; }
  } else if (claimedProfile) {
    linkReason = "profile_not_found";
  }

  const { error: subErr } = await supabase.from("wbi_subscribers").upsert({
    msisdn,
    service: service ?? undefined,
    operator: network?.toLowerCase() ?? undefined,
    status,
    subscribed_at: confirmed && !existing ? (startDate ?? nowIso) : undefined,
    profile_id: profileId ?? existing?.profile_id ?? null,
    updated_at: nowIso,
  }, { onConflict: "msisdn" });
  if (subErr) console.error("wbi_subscribers upsert:", subErr.message);

  let linked = false;
  if (profileId) {
    const { error: linkErr } = await supabase.from("profiles").update({ msisdn }).eq("id", profileId);
    if (linkErr) { console.error("profiles.msisdn link:", linkErr.message); linkReason = "link_failed"; }
    else linked = true;
  }

  return json({ ok: true, linked, reason: linkReason, status });
});
