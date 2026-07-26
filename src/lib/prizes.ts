/**
 * Kraal Prize draws — DEMO DATA layer.
 *
 * Everything here is client-side placeholder logic for demoing the prize
 * UX. Prize values are hardcoded, entries are derived deterministically
 * from local profile stats, and draw times are computed from the device
 * clock. None of it is authoritative.
 *
 * The production version replaces this module with a server-backed
 * ledger: entries issued by Supabase against audited coin transactions,
 * draw times from the server clock, and prize values from a draws table.
 * The UI consumes the same shapes, so the swap is contained here.
 */

export type DrawKind = 'daily' | 'weekly' | 'grand';

export interface PrizeDraw {
  kind: DrawKind;
  icon: string;          // emoji identity; grand uses the Golden Bull
  name: string;
  valueRand: number;
  closesAt: Date;
  cta: string;
}

export function formatRand(v: number): string {
  return `R${v.toLocaleString('en-ZA')}`;
}

/** Next local midnight. */
export function nextDailyDraw(now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  return d;
}

/** Next Sunday 19:00 local (if it's Sunday before 19:00, today). */
export function nextWeeklyDraw(now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0);
  const day = d.getDay(); // 0 = Sunday
  let add = (7 - day) % 7;
  if (add === 0 && now.getTime() >= d.getTime()) add = 7;
  d.setDate(d.getDate() + add);
  return d;
}

/** First of next month, 12:00 local. */
export function nextGrandDraw(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 12, 0, 0);
}

export function getDraws(now: Date = new Date()): PrizeDraw[] {
  return [
    {
      kind: 'daily',
      icon: '🏆',
      name: "Today's Kraal Prize",
      valueRand: 250,
      closesAt: nextDailyDraw(now),
      cta: 'Play a match to earn entries',
    },
    {
      kind: 'weekly',
      icon: '🏅',
      name: 'Weekly Kraal Prize',
      valueRand: 1000,
      closesAt: nextWeeklyDraw(now),
      cta: 'Win matches to stack entries',
    },
    {
      kind: 'grand',
      icon: '🐂',
      name: 'Grand Kraal Prize',
      valueRand: 3250,
      closesAt: nextGrandDraw(now),
      cta: 'Every coin earned is a chance',
    },
  ];
}

/**
 * DEMO entry count — deterministic from local profile stats so the
 * number visibly grows as the player plays, without a real ledger.
 * Production: SELECT count(*) FROM entries WHERE profile_id = ...
 */
export function demoEntries(profile: { wins: number; coins: number } | null, kind: DrawKind): number {
  if (!profile) return 0;
  const base = profile.wins * 5 + Math.floor(profile.coins / 10);
  // Longer-window draws accumulate more entries.
  if (kind === 'daily') return Math.max(1, Math.floor(base / 6));
  if (kind === 'weekly') return Math.max(1, Math.floor(base / 2));
  return Math.max(1, base);
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export function countdownTo(target: Date, now: Date = new Date()): CountdownParts {
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const s = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(s / 86_400),
    hours: Math.floor((s % 86_400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    totalMs,
  };
}

/** Short human label for banners: "18 days" / "6h 12m" / "42m". */
export function countdownLabel(target: Date, now: Date = new Date()): string {
  const c = countdownTo(target, now);
  if (c.days >= 2) return `${c.days} days`;
  if (c.days >= 1) return `${c.days}d ${c.hours}h`;
  if (c.hours >= 1) return `${c.hours}h ${c.minutes}m`;
  return `${c.minutes}m`;
}
