import { describe, it, expect } from 'vitest';
import {
  initialHerd, startDay, doChore, herdHealth, daysBetween,
  guardianAdornments, careCompletedToday, type HerdState,
} from './herd';

const never = () => 0.99; // rand that never triggers the random moment

function careFullDay(s: HerdState, day: string) {
  let state = s;
  for (const chore of ['feed', 'water', 'health'] as const) {
    state = doChore(state, chore, day, never).state;
  }
  return state;
}

describe('daysBetween', () => {
  it('computes whole-day gaps', () => {
    expect(daysBetween('2026-07-01', '2026-07-01')).toBe(0);
    expect(daysBetween('2026-07-01', '2026-07-02')).toBe(1);
    expect(daysBetween('2026-06-30', '2026-07-02')).toBe(2);
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
  });
});

describe('care day completion', () => {
  it('completes only when all three chores are done', () => {
    let s = initialHerd();
    s = doChore(s, 'feed', '2026-07-07', never).state;
    s = doChore(s, 'water', '2026-07-07', never).state;
    expect(careCompletedToday(s, '2026-07-07')).toBe(false);
    const { state, events } = doChore(s, 'health', '2026-07-07', never);
    expect(careCompletedToday(state, '2026-07-07')).toBe(true);
    expect(state.careStreak).toBe(1);
    expect(events[0].type).toBe('care');
    expect(events[0].coins).toBe(6); // 5 + min(1,10)
  });

  it('ignores repeat chores and post-completion chores', () => {
    let s = careFullDay(initialHerd(), '2026-07-07');
    const before = s;
    s = doChore(s, 'feed', '2026-07-07', never).state;
    expect(s).toEqual(before);
  });

  it('resets chores on a new day', () => {
    let s = careFullDay(initialHerd(), '2026-07-07');
    s = startDay(s, '2026-07-08');
    expect(s.choresDone).toEqual({ feed: false, water: false, health: false });
    expect(s.careStreak).toBe(1); // 1-day gap keeps the streak alive
  });
});

describe('streaks', () => {
  it('grows across consecutive days and breaks after a 2+ day gap', () => {
    let s = careFullDay(initialHerd(), '2026-07-07');
    s = careFullDay(s, '2026-07-08');
    expect(s.careStreak).toBe(2);
    s = startDay(s, '2026-07-11'); // missed 2 days
    expect(s.careStreak).toBe(0);
    expect(s.bestStreak).toBe(2);
    s = careFullDay(s, '2026-07-11');
    expect(s.careStreak).toBe(1);
  });
});

describe('milestones', () => {
  it('awards calf at 3, kraal at 7, rare Nguni at 14, bull at 30', () => {
    let s = initialHerd();
    const day = (n: number) => `2026-08-${String(n).padStart(2, '0')}`;
    for (let n = 1; n <= 30; n++) s = careFullDay(s, day(n));
    expect(s.careStreak).toBe(30);
    expect(s.cattle).toBe(1 + 1 + 1 + 1); // guardian + calf + rare + bull
    expect(s.kraalLevel).toBe(2);
    expect(s.rareNguni).toBe(1);
    expect(s.hasChampionBull).toBe(true);
  });

  it('keeps growing every 7 days past 30', () => {
    let s: HerdState = { ...initialHerd(), careStreak: 36, bestStreak: 36, lastCareDate: '2026-07-06', totalCareDays: 36 };
    s = careFullDay(s, '2026-07-07'); // streak 37 = 30 + 7
    expect(s.cattle).toBe(2);
  });
});

describe('herd health', () => {
  it('maps day gaps to condition tiers', () => {
    const s = { ...initialHerd(), lastCareDate: '2026-07-07' };
    expect(herdHealth(s, '2026-07-07')).toBe('thriving');
    expect(herdHealth(s, '2026-07-08')).toBe('healthy');
    expect(herdHealth(s, '2026-07-09')).toBe('hungry');
    expect(herdHealth(s, '2026-07-10')).toBe('hungry');
    expect(herdHealth(s, '2026-07-11')).toBe('neglected');
  });

  it('never punishes a brand-new herd', () => {
    expect(herdHealth(initialHerd(), '2026-07-07')).toBe('healthy');
  });
});

describe('random moments', () => {
  it('fires a moment when rand is low, including calf births', () => {
    let s = initialHerd();
    s = doChore(s, 'feed', '2026-07-07').state;
    s = doChore(s, 'water', '2026-07-07').state;
    const { state, events } = doChore(s, 'health', '2026-07-07', () => 0.0); // moment roll 0 → first entry (calf)
    expect(events.some((e) => e.type === 'moment')).toBe(true);
    expect(state.cattle).toBe(2);
  });
});

describe('guardian adornments', () => {
  it('unlock at 3/7/14/30 best-streak', () => {
    expect(guardianAdornments(0)).toEqual([]);
    expect(guardianAdornments(3)).toEqual(['Reed Collar']);
    expect(guardianAdornments(30)).toEqual(['Reed Collar', 'Ceremonial Beads', 'Painted Horns', 'Royal Blanket']);
  });
});
