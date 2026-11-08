/**
 * Subscriber access gate for gated instances (BRAND.accessGate).
 *
 * Rule (Jacqui, 8 Nov 2026): the game is closed to anyone we have not
 * received a subscribe notification for. The number comes from the
 * telco hand-off URL (/welcome?tn=…); the server checks it against the
 * subscribers Worldplay has notified us about. The result is cached on
 * the device so returning players open straight into the game, and
 * re-verified on every launch (an unsubscribe revokes access).
 */
import { BRAND } from '../brand';

const KEY = 'morabaraba.access';

export type AccessStatus = 'granted' | 'denied' | 'unknown';

export interface AccessRecord {
  msisdn: string;
  status: AccessStatus;
  reason: string | null;
  checkedAt: string;
}

export function readAccess(): AccessRecord | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AccessRecord) : null;
  } catch { return null; }
}

function writeAccess(rec: AccessRecord): void {
  try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch { /* ignore */ }
}

export function clearAccess(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/**
 * Pure decision: what to do given the server's answer (or lack of one)
 * and the last cached record. Offline with a previous grant → keep
 * playing; offline with nothing → unknown (caller shows the gate).
 */
export function decideAccess(
  server: { granted: boolean } | null,
  cached: AccessRecord | null,
): AccessStatus {
  if (server) return server.granted ? 'granted' : 'denied';
  if (cached?.status === 'granted') return 'granted';
  return 'unknown';
}

/** Ask the server whether this number may play. Null = could not reach it. */
export async function checkAccessRemote(msisdn: string): Promise<{ granted: boolean; status: string; reason: string | null } | null> {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/functions/v1/access-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand: BRAND.id, msisdn }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { granted: boolean; status: string; reason: string | null };
  } catch { return null; }
}

/**
 * Resolve access for a launch. `fresh` = the player just arrived via the
 * hand-off with a confirmed DOI: the subscribe notification normally
 * lands within seconds, so we retry a few times before giving up.
 */
export async function resolveAccess(msisdn: string | undefined, fresh: boolean): Promise<AccessRecord> {
  const cached = readAccess();
  const number = msisdn ?? cached?.msisdn;
  if (!number) {
    return { msisdn: '', status: 'unknown', reason: 'no_msisdn', checkedAt: new Date().toISOString() };
  }
  const attempts = fresh ? 5 : 1;
  let server: { granted: boolean; status: string; reason: string | null } | null = null;
  for (let i = 0; i < attempts; i++) {
    server = await checkAccessRemote(number);
    if (server?.granted) break;
    if (server && !fresh) break;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 2000));
  }
  const status = decideAccess(server, cached?.msisdn === number ? cached : null);
  const rec: AccessRecord = { msisdn: number, status, reason: server?.reason ?? (server ? null : 'offline'), checkedAt: new Date().toISOString() };
  if (status !== 'unknown') writeAccess(rec);
  return rec;
}
