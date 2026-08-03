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

import { getConfig } from './remoteConfig';
import { supabase, SUPABASE_ENABLED } from './supabase';

export type DrawKind = 'daily' | 'weekly' | 'grand';

export interface MyEntries { daily: number; weekly: number; grand: number }

let entriesCache: { value: MyEntries; at: number } | null = null;

/**
 * Real server-side entry counts for the signed-in player (my_draw_entries
 * RPC, 60s cache). Returns null when offline / signed out — callers fall
 * back to demoEntries().
 */
export async function fetchMyEntries(): Promise<MyEntries | null> {
  if (!SUPABASE_ENABLED || !supabase) return null;
  if (entriesCache && Date.now() - entriesCache.at < 60_000) return entriesCache.value;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const { data, error } = await supabase.rpc('my_draw_entries');
    if (error || !data) return null;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    const value: MyEntries = {
      daily: Number(row.daily) || 0,
      weekly: Number(row.weekly) || 0,
      grand: Number(row.grand) || 0,
    };
    entriesCache = { value, at: Date.now() };
    return value;
  } catch { return null; }
}

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

/*
 * Client-confirmed schedule (Jacqui, 30 Jul 2026): draws close 11:59 PM —
 * daily every night, weekly Sunday night, monthly on the last day of the
 * month. Midnight is the period boundary ("everything from 12:00 AM
 * belongs to the next one"), so each close is modelled as the following
 * midnight. Winner notification goes out 10:00 the next morning
 * (server-side concern, not handled here).
 */

/** Next local midnight. */
export function nextDailyDraw(now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  return d;
}

/** End of Sunday = next Monday 00:00 local. */
export function nextWeeklyDraw(now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const add = ((8 - d.getDay()) % 7) || 7; // days until next Monday
  d.setDate(d.getDate() + add);
  return d;
}

/** End of the month's last day = first of next month, 00:00 local. */
export function nextGrandDraw(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
}

export function getDraws(now: Date = new Date()): PrizeDraw[] {
  const values = getConfig().prize_values;
  return [
    {
      kind: 'daily',
      icon: '🏆',
      name: "Today's Kraal Prize",
      valueRand: values.daily,
      closesAt: nextDailyDraw(now),
      cta: 'Play a match to earn entries',
    },
    {
      kind: 'weekly',
      icon: '🏅',
      name: 'Weekly Kraal Prize',
      valueRand: values.weekly,
      closesAt: nextWeeklyDraw(now),
      cta: 'Win matches to stack entries',
    },
    {
      kind: 'grand',
      icon: '🐂',
      name: 'Grand Kraal Prize',
      valueRand: values.grand,
      closesAt: nextGrandDraw(now),
      cta: 'Every coin earned is a chance',
    },
  ];
}

/**
 * DEMO entry count — client-confirmed rule is 1 entry into EACH pool per
 * 10 coins earned, capped at 20 entries/day. Without a server ledger we
 * can't track "earned during this window", so the demo uses the current
 * balance as a proxy, identical across pools.
 * Production: SELECT count(*) FROM entries WHERE profile_id = ... AND draw_id = ...
 */
export function demoEntries(profile: { wins: number; coins: number } | null, _kind: DrawKind): number {
  if (!profile) return 0;
  return Math.floor(profile.coins / getConfig().entries.coins_per_entry);
}

/** Client-confirmed monthly leaderboard performance rewards (airtime). */
export function performancePodium(): { place: string; valueRand: number }[] {
  const p = getConfig().podium;
  return [
    { place: '1st', valueRand: p.first },
    { place: '2nd', valueRand: p.second },
    { place: '3rd', valueRand: p.third },
  ];
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
