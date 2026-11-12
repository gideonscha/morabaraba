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

  // One subscriber can be on several bundle services (Bundle_Games_D,
  // Bundle_My_W, …). Track each (number, service) pair, then derive the
  // number's overall status: active if ANY service is active.
  const service = p.client ?? "unknown";
  async function setService(status: "active" | "unsubscribed", when: string | null, extra: Record<string, unknown> = {}) {
    if (!msisdn) return;
    await supabase.from("wbi_subscriber_services").upsert({
      msisdn, service, operator: p.operator ?? null, status,
      ...(status === "active" ? { subscribed_at: when ?? nowIso, unsubscribed_at: null } : { unsubscribed_at: when ?? nowIso }),
      updated_at: nowIso,
    }, { onConflict: "msisdn,service" });
    const { count } = await supabase.from("wbi_subscriber_services")
      .select("service", { count: "exact", head: true }).eq("msisdn", msisdn).eq("status", "active");
    const anyActive = (count ?? 0) > 0;
    const { data: existing } = await supabase.from("wbi_subscribers").select("subscribed_at").eq("msisdn", msisdn).maybeSingle();
    await supabase.from("wbi_subscribers").upsert({
      ...base,
      status: anyActive ? "active" : "unsubscribed",
      subscribed_at: anyActive ? (existing?.subscribed_at ?? when ?? nowIso) : existing?.subscribed_at ?? null,
      unsubscribed_at: anyActive ? null : (when ?? nowIso),
      ...extra,
    }, { onConflict: "msisdn" });
  }

  switch (mt.toLowerCase()) {
    case "tnsubscribe": {
      await setService("active", parseWbiTime(p.subdate));
      break;
    }
    case "soiresult": {
      // Opt-in outcome. statusId 0 (or 41 AlreadySubscribed) = success.
      const ok = statusId === 0 || statusId === 41;
      const op = (p.op ?? "").toUpperCase();
      if (msisdn && ok) {
        if (op === "TERMINATE") await setService("unsubscribed", null, { unsubscribe_source: "DOI" });
        else await setService("active", parseWbiTime(p.subdate));
      }
      break;
    }
    case "sdresult": {
      // Billing outcome. A successful bill for a service proves that
      // service is active (the bundle may bill before, or instead of,
      // sending tnSubscribe), so it also sets the (number, service) row.
      // A failed bill records the attempt without changing status.
      if (msisdn) {
        const billing = {
          last_bill_at: parseWbiTime(p.statustime) ?? nowIso,
          last_bill_status: statusId,
          last_bill_amount_cents: amount,
        };
        if (statusId === 0) {
          await setService("active", parseWbiTime(p.statustime), billing);
        } else {
          const { data: existing } = await supabase
            .from("wbi_subscribers").select("status").eq("msisdn", msisdn).maybeSingle();
          await supabase.from("wbi_subscribers").upsert({
            ...base, status: existing?.status ?? "pending", ...billing,
          }, { onConflict: "msisdn" });
        }
      }
      break;
    }
    case "tnunsubscribe": {
      // Revokes THIS service only; the number stays active while any
      // other bundle service is still active.
      await setService("unsubscribed", parseWbiTime(p.statustime), { unsubscribe_source: p.source ?? null });
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
