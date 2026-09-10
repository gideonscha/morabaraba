/**
 * Subscriber arrival from the telco hand-off.
 *
 * Worldplay uses ONE Content URL for both newly-subscribed and returning
 * subscribers (Jeremy, 9 Sep 2026) — that URL is /welcome. /return is kept
 * as an alias so either works. We cannot tell new from returning at the
 * URL level; that distinction comes from the parameters Worldplay appends
 * (still to be confirmed) and, later, the wbi_subscribers table.
 *
 * Captures whatever parameters the telco appends, remembers them on the
 * device, and cleans the address bar so the PWA behaves normally after.
 * Server-side linking (MSISDN ↔ profile) is wired once Worldplay confirms
 * the exact parameters — see docs/integration questions.
 */

const KEY = 'morabaraba.subscriber';

export interface SubscriberArrival {
  via: 'welcome' | 'return';
  msisdn?: string;
  token?: string;
  refId?: string;
  params: Record<string, string>;
  at: string;
}

/** Call once on boot. Returns the arrival if this load came via a WBI URL. */
export function captureSubscriberArrival(): SubscriberArrival | null {
  if (typeof location === 'undefined') return null;
  const path = location.pathname.replace(/\/+$/, '').toLowerCase();
  if (path !== '/welcome' && path !== '/return') return null;

  const params: Record<string, string> = {};
  new URLSearchParams(location.search).forEach((v, k) => { params[k.toLowerCase()] = v; });

  const arrival: SubscriberArrival = {
    via: path === '/welcome' ? 'welcome' : 'return',
    msisdn: params.msisdn ?? params.telno ?? params.tel ?? params.cli,
    token: params.token ?? params.ai ?? params.t,
    refId: params.refid ?? params.ref ?? params.rn,
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
