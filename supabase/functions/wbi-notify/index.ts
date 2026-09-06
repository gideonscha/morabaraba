// Worldplay WBI notification endpoint.
//
// Receives subscription / billing / unsubscribe / opt-in / recharge
// notifications (WBI spec v5.3a §2.2, §3.1, §3.2, §4.3, §5.2) as GET or
// POST (form-encoded), logs every message verbatim to wbi_events, updates
// wbi_subscribers, and answers the XML acknowledgement WBI expects so it
// stops retrying.
//
// Auth: the spec sends no signature, so the URL carries a secret token
// (?k=...) stored in integration_secrets, plus an optional source-IP
// allowlist (integration_secrets.wbi_allowed_ips, comma-separated).
//
// Deployed with verify_jwt=false — WBI cannot send a Supabase JWT.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const xml = (errorCode: number, description?: string, status = 200) =>
  new Response(
    `<r><errorCode>${errorCode}</errorCode>` +
      (description ? `<errorDescription>${description}</errorDescription>` : "") +
      `</r>`,
    { status, headers: { "Content-Type": "text/xml; charset=utf-8" } },
  );

/** WBI dates are 'yyyy-mm-dd hh:mm:ss' in SA local time. */
function parseWbiTime(s: string | undefined): string | null {
  if (!s) return null;
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/);
  if (!m) return null;
  const [, y, mo, d, h = "00", mi = "00", se = "00"] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${se}+02:00`;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // Parameter names are case-insensitive per spec — normalise to lowercase.
  const p: Record<string, string> = {};
  url.searchParams.forEach((v, k) => { p[k.toLowerCase()] = v; });
  if (req.method === "POST") {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      for (const [k, v] of Object.entries(body)) p[k.toLowerCase()] = String(v);
    } else {
      const text = await req.text();
      new URLSearchParams(text).forEach((v, k) => { p[k.toLowerCase()] = v; });
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: secretRows } = await supabase
    .from("integration_secrets")
    .select("key,value")
    .in("key", ["wbi_notify_token", "wbi_allowed_ips"]);
  const secrets: Record<string, string> = Object.fromEntries(
    (secretRows ?? []).map((r: { key: string; value: string }) => [r.key, r.value]),
  );

  if (!secrets.wbi_notify_token || p.k !== secrets.wbi_notify_token) {
    return xml(403, "Forbidden", 403);
  }
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const allowed = (secrets.wbi_allowed_ips ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (allowed.length > 0 && !allowed.includes(ip)) {
    return xml(403, "Source not allowed", 403);
  }
  delete p.k;

  const mt = (p.mt ?? "").trim();
  if (!mt) return xml(400, "Missing mt", 400);

  const msisdn = p.telno ?? null;
  const statusId = p.statusid !== undefined && p.statusid !== "" ? parseInt(p.statusid, 10) : null;
  const amount = p.amount !== undefined && p.amount !== "" ? parseInt(p.amount, 10) : null;
  const nowIso = new Date().toISOString();

  await supabase.from("wbi_events").insert({
    mt,
    msisdn,
    service: p.client ?? null,
    operator: p.operator ?? null,
    request_id: p.requestid ?? null,
    ref_id: p.refid ?? null,
    status_id: Number.isFinite(statusId as number) ? statusId : null,
    status_message: p.statusmessage ?? null,
    amount_cents: Number.isFinite(amount as number) ? amount : null,
    payload: p,
    source_ip: ip || null,
  });

  const base = {
    msisdn,
    service: p.client ?? null,
    operator: p.operator ?? null,
    dep_subscription_id: p.depsubscriptionid ?? null,
    updated_at: nowIso,
  };

  switch (mt.toLowerCase()) {
    case "tnsubscribe": {
      if (msisdn) {
        await supabase.from("wbi_subscribers").upsert({
          ...base,
          status: "active",
          subscribed_at: parseWbiTime(p.subdate) ?? nowIso,
          unsubscribed_at: null,
        }, { onConflict: "msisdn" });
      }
      break;
    }
    case "soiresult": {
      // Opt-in outcome. statusId 0 (or 41 AlreadySubscribed) = success.
      const ok = statusId === 0 || statusId === 41;
      const op = (p.op ?? "").toUpperCase();
      if (msisdn && ok) {
        if (op === "TERMINATE") {
          await supabase.from("wbi_subscribers").upsert({
            ...base, status: "unsubscribed", unsubscribed_at: nowIso, unsubscribe_source: "DOI",
          }, { onConflict: "msisdn" });
        } else {
          await supabase.from("wbi_subscribers").upsert({
            ...base, status: "active", subscribed_at: parseWbiTime(p.subdate) ?? nowIso, unsubscribed_at: null,
          }, { onConflict: "msisdn" });
        }
      }
      break;
    }
    case "sdresult": {
      // Billing outcome — record it without touching an existing status.
      if (msisdn) {
        const { data: existing } = await supabase
          .from("wbi_subscribers").select("status").eq("msisdn", msisdn).maybeSingle();
        await supabase.from("wbi_subscribers").upsert({
          ...base,
          status: existing?.status ?? (statusId === 0 ? "active" : "pending"),
          last_bill_at: parseWbiTime(p.statustime) ?? nowIso,
          last_bill_status: statusId,
          last_bill_amount_cents: amount,
        }, { onConflict: "msisdn" });
      }
      break;
    }
    case "tnunsubscribe": {
      if (msisdn) {
        await supabase.from("wbi_subscribers").upsert({
          ...base,
          status: "unsubscribed",
          unsubscribed_at: parseWbiTime(p.statustime) ?? nowIso,
          unsubscribe_source: p.source ?? null,
        }, { onConflict: "msisdn" });
      }
      break;
    }
    case "rechargeresult": {
      // Airtime prize payout outcome — closes the loop on payouts.
      if (p.requestid) {
        await supabase.from("payouts").update({
          worldplay_status_id: statusId,
          status: statusId === 0 ? "paid" : "failed",
          note: statusId === 0
            ? `Airtime delivered (Worldplay request ${p.requestid})`
            : `Worldplay error ${statusId}: ${p.statusmessage ?? "unknown"}`,
          updated_at: nowIso,
        }).eq("worldplay_request_id", p.requestid);
      }
      break;
    }
    default:
      // Unknown type: logged above, acknowledged so WBI doesn't retry.
      break;
  }

  return xml(0);
});
