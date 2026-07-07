/**
 * Herd care — pure logic for the "Tend Your Herd" daily-care loop.
 *
 * Design notes:
 * - The herd never dies. Missing days only lowers its condition;
 *   returning restores it. Gentle by design.
 * - A "care day" completes when all three chores (feed, water, health
 *   check) are done on the same local calendar day.
 * - Streak milestones grow the kraal: 3 days → calf, 7 → kraal expands,
 *   14 → rare Nguni, 30 → champion bull. Past 30, every further 7 days
 *   of unbroken care brings another calf so long streaks keep growing.
 * - All date handling uses local YYYY-MM-DD strings; all randomness is
 *   injected so tests stay deterministic.
 */

export type HerdHealth = 'thriving' | 'healthy' | 'hungry' | 'neglected';
export type Chore = 'feed' | 'water' | 'health';

export interface HerdState {
  guardianName: string | null;
  cattle: number;           // herd size, guardian included
  rareNguni: number;
  hasChampionBull: boolean;
  kraalLevel: number;
  careStreak: number;       // consecutive completed care days
  bestStreak: number;
  totalCareDays: number;
  lastCareDate: string | null;  // YYYY-MM-DD of last completed care
  choresDone: Record<Chore, boolean>;
  choresDate: string | null;    // day the choresDone flags belong to
}

export interface CareEvent {
  type: 'care' | 'calf' | 'kraal' | 'rare' | 'bull' | 'moment';
  text: string;
  coins: number;
}

export function initialHerd(): HerdState {
  return {
    guardianName: null,
    cattle: 1,
    rareNguni: 0,
    hasChampionBull: false,
    kraalLevel: 1,
    careStreak: 0,
    bestStreak: 0,
    totalCareDays: 0,
    lastCareDate: null,
    choresDone: { feed: false, water: false, health: false },
    choresDate: null,
  };
}

/** Local calendar date as YYYY-MM-DD. */
export function todayString(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole days from a to b (both YYYY-MM-DD). Positive when b is later. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const utcA = Date.UTC(ay, am - 1, ad);
  const utcB = Date.UTC(by, bm - 1, bd);
  return Math.round((utcB - utcA) / 86_400_000);
}

/** Condition tiers, derived from days since the last completed care. */
export function herdHealth(state: HerdState, today: string): HerdHealth {
  if (!state.lastCareDate) return 'healthy'; // new herd, not yet neglected
  const gap = daysBetween(state.lastCareDate, today);
  if (gap <= 0) return 'thriving';
  if (gap === 1) return 'healthy';
  if (gap <= 3) return 'hungry';
  return 'neglected';
}

export const HEALTH_LABEL: Record<HerdHealth, string> = {
  thriving:  'Thriving',
  healthy:   'Healthy',
  hungry:    'Hungry',
  neglected: 'Neglected',
};

/**
 * Roll the state forward to `today`: reset chore flags on a new day and
 * break the streak if more than one day has passed since the last care.
 * Idempotent — safe to call on every screen mount.
 */
export function startDay(state: HerdState, today: string): HerdState {
  let next = state;
  if (state.choresDate !== today) {
    next = { ...next, choresDone: { feed: false, water: false, health: false }, choresDate: today };
  }
  if (next.lastCareDate && daysBetween(next.lastCareDate, today) > 1 && next.careStreak !== 0) {
    next = { ...next, careStreak: 0 };
  }
  return next;
}

export function careCompletedToday(state: HerdState, today: string): boolean {
  return state.lastCareDate === today;
}

/** Guardian adornments unlocked by the best streak ever reached. */
export function guardianAdornments(bestStreak: number): string[] {
  const out: string[] = [];
  if (bestStreak >= 3) out.push('Reed Collar');
  if (bestStreak >= 7) out.push('Ceremonial Beads');
  if (bestStreak >= 14) out.push('Painted Horns');
  if (bestStreak >= 30) out.push('Royal Blanket');
  return out;
}

const MOMENTS: { text: string; coins: number; calf?: boolean }[] = [
  { text: 'A calf was born overnight!', coins: 0, calf: true },
  { text: 'A traveller gifted your herd fresh grazing.', coins: 3 },
  { text: 'One of your cows found fertile grazing.', coins: 3 },
  { text: 'Your prize bull is attracting admirers from the next kraal.', coins: 2 },
  { text: 'The herd rested well under a full moon.', coins: 2 },
];

/**
 * Mark one chore done. When the third chore lands, the care day
 * completes: streak advances, coins are earned, milestones and a
 * possible random moment fire. Returns the new state plus any events
 * (empty while chores are still in progress).
 *
 * `rand` is injected for testability; pass Math.random in app code.
 */
export function doChore(
  state: HerdState,
  chore: Chore,
  today: string,
  rand: () => number = Math.random,
): { state: HerdState; events: CareEvent[] } {
  let s = startDay(state, today);
  if (careCompletedToday(s, today)) return { state: s, events: [] };
  if (s.choresDone[chore]) return { state: s, events: [] };

  s = { ...s, choresDone: { ...s.choresDone, [chore]: true } };
  const allDone = s.choresDone.feed && s.choresDone.water && s.choresDone.health;
  if (!allDone) return { state: s, events: [] };

  // --- Care day complete ---
  const events: CareEvent[] = [];
  const streak = s.careStreak + 1;
  s = {
    ...s,
    careStreak: streak,
    bestStreak: Math.max(s.bestStreak, streak),
    totalCareDays: s.totalCareDays + 1,
    lastCareDate: today,
  };

  const careCoins = 5 + Math.min(streak, 10);
  events.push({ type: 'care', text: `Your herd is thriving. Day ${streak} of care.`, coins: careCoins });

  if (streak === 3) {
    s = { ...s, cattle: s.cattle + 1 };
    events.push({ type: 'calf', text: 'Three days of care — a new calf joins the herd!', coins: 0 });
  }
  if (streak === 7) {
    s = { ...s, kraalLevel: s.kraalLevel + 1 };
    events.push({ type: 'kraal', text: 'Seven days strong — your kraal expands!', coins: 10 });
  }
  if (streak === 14) {
    s = { ...s, rareNguni: s.rareNguni + 1, cattle: s.cattle + 1 };
    events.push({ type: 'rare', text: 'Fourteen days of devotion — a rare Nguni joins your herd!', coins: 15 });
  }
  if (streak === 30) {
    s = { ...s, hasChampionBull: true, cattle: s.cattle + 1 };
    events.push({ type: 'bull', text: 'Thirty days! A champion breeding bull arrives at your kraal!', coins: 30 });
  }
  if (streak > 30 && (streak - 30) % 7 === 0) {
    s = { ...s, cattle: s.cattle + 1 };
    events.push({ type: 'calf', text: 'Your legendary care attracts another calf to the herd.', coins: 0 });
  }

  // Random daily moment — ~30% of completed care days.
  if (rand() < 0.3) {
    const m = MOMENTS[Math.floor(rand() * MOMENTS.length)];
    if (m.calf) s = { ...s, cattle: s.cattle + 1 };
    events.push({ type: 'moment', text: m.text, coins: m.coins });
  }

  return { state: s, events };
}
