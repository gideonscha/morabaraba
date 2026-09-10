/**
 * Subscriber arrival from the telco hand-off (Worldplay Web DOI
 * Interface v2.3b, §3 "DOI Return").
 *
 * Worldplay uses ONE return URL for both newly-subscribed and returning
 * subscribers (Jeremy, 9 Sep 2026) — /welcome. /return is an alias.
 *
 * After DOI the user is redirected here with:
 *   ei       error id — 0 = confirmed (valid subscriber), 986 = declined,
 *            41 = already subscribed (treat as confirmed), else failure
 *   em       error message for non-zero ei
 *   tn       TelNo / MSISDN — always present when confirmed; on Vodacom
 *            it is "CTB:<subscription id>" (their real number is hidden)
 *   nt       network: Vodacom, MTN, CellC or Telkom
 *   sd       subscription start date YYYY-MM-DD
 *   cl       Worldplay service name
 *   ex       our reference, if the DOI request carried one
 *   channel  [MTN] acquisition channel
 *   rc/al/ec deprecated — ignored
 *
 * The arrival is remembered on the device, the address bar is cleaned,
 * and the outcome is reported to the subscriber-arrive Edge Function,
 * which logs it and links the MSISDN to the player's profile. Worldplay's
 * own notifications (tnSubscribe / sdResult / tnUnsubscribe) remain the
 * authoritative source of subscription status.
 */

const KEY = 'morabaraba.subscriber';

export type DoiStatus = 'confirmed' | 'declined' | 'error' | 'unknown';

export interface SubscriberArrival {
  via: 'welcome' | 'return';
  status: DoiStatus;
  errorId: number | null;
  errorMessage?: string;
  msisdn?: string;
  network?: string;
  service?: string;
  startDate?: string;
  reference?: string;
  channel?: string;
  params: Record<string, string>;
  at: string;
  reported?: boolean;
}

/** Pure: interpret DOI Return parameters (keys lower-cased). */
export function parseDoiReturn(params: Record<string, string>): Omit<SubscriberArrival, 'via' | 'at' | 'params'> {
  const eiRaw = params.ei;
  const errorId = eiRaw !== undefined && eiRaw !== '' && /^-?\d+$/.test(eiRaw) ? parseInt(eiRaw, 10) : null;
  let status: DoiStatus = 'unknown';
  if (errorId === 0 || errorId === 41) status = 'confirmed';
  else if (errorId === 986) status = 'declined';
  else if (errorId !== null) status = 'error';

  const tn = (params.tn ?? params.telno ?? params.msisdn ?? '').trim();
  const msisdn = /^(CTB:)?\d{6,15}$/i.test(tn) ? tn : undefined;

  return {
    status,
    errorId,
    errorMessage: params.em || undefined,
    msisdn,
    network: params.nt || undefined,
    service: params.cl || undefined,
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(params.sd ?? '') ? params.sd : undefined,
    reference: params.ex || undefined,
    channel: params.channel || undefined,
  };
}

/** Call once on boot. Returns the arrival if this load came via the hand-off URL. */
export function captureSubscriberArrival(): SubscriberArrival | null {
  if (typeof location === 'undefined') return null;
  const path = location.pathname.replace(/\/+$/, '').toLowerCase();
  if (path !== '/welcome' && path !== '/return') return null;

  const params: Record<string, string> = {};
  new URLSearchParams(location.search).forEach((v, k) => { params[k.toLowerCase()] = v; });

  const arrival: SubscriberArrival = {
    via: path === '/welcome' ? 'welcome' : 'return',
    ...parseDoiReturn(params),
    params,
    at: new Date().toISOString(),
  };
  try { localStorage.setItem(KEY, JSON.stringify(arrival)); } catch { /* ignore */ }
  try { history.replaceState(null, '', '/'); } catch { /* ignore */ }
  return arrival;
}

export function getSubscriber(): SubscriberArrival | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SubscriberArrival) : null;
  } catch { return null; }
}

/**
 * Report the arrival to the server (fire-and-forget, once). Links the
 * MSISDN to the player's profile when a profile id is known.
 */
export async function reportArrival(arrival: SubscriberArrival, profileId?: string): Promise<void> {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!base || arrival.reported || arrival.status === 'unknown') return;
  try {
    const res = await fetch(`${base}/functions/v1/subscriber-arrive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        via: arrival.via,
        ei: arrival.errorId,
        em: arrival.errorMessage,
        tn: arrival.msisdn,
        nt: arrival.network,
        sd: arrival.startDate,
        cl: arrival.service,
        ex: arrival.reference,
        channel: arrival.channel,
        profile_id: profileId ?? null,
        at: arrival.at,
      }),
    });
    if (res.ok) {
      try { localStorage.setItem(KEY, JSON.stringify({ ...arrival, reported: true })); } catch { /* ignore */ }
    }
  } catch { /* offline — will simply not be reported */ }
}
